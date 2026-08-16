import * as utils from '@dcl-sdk/utils'
import { AudioSource, engine, Entity, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem } from '@dcl/sdk/ecs'
import { AssetLoad } from "@dcl/sdk/ecs"


import { eventBus, ClientEvents } from 'src/shared/utils/eventBus'

import { sfx } from 'src/client/data/sfx'
import { Vector2, Vector3 } from '@dcl/sdk/math'
export { sfx } from 'src/client/data/sfx'

export namespace SoundManager {


	// MARK: settings
	const FADE_DURATION          = 1.0                                // Duration when fading music in/out
	const BGM_VOLUME             = 0.2                               // Fixed AudioSource volume (never mutated while playing)
	const BGM_FADE_NEAR          = 0                                  // Local Y offset = full loudness (parented to camera)
	const BGM_FADE_FAR           = 48                                 // Local Y offset = effectively silent via spatial falloff
	const SFX_ENTITY_VOLUME      = 1.0                                // Volume on preloaded one-shot entities (retrigger uses this as baseline)
	const COUNTDOWN_LAST_SECONDS = 5                                  // How many of the last seconds to play countdown sounds for


	// MARK: state vars
	let isInitialized            = false                              // basic init flag

	type BgmFadePhase            = 'idle' | 'fadingIn' | 'fadingOut'
	let bgmFadePhase             : BgmFadePhase           = 'idle'    // current fade phase
	let bgmEntity                : Entity                             // background music entity
	let preloadEntity            : Entity                             // preload entity
	let fadeElapsed              = 0                                  // elapsed time since last fade change (used by systemUpdateSound)
	let fadeFromDistance         = BGM_FADE_FAR                       // distance at the start of the current fade segment
	let fadeToDistance           = BGM_FADE_NEAR                      // distance at the end of the current fade segment
	let bgmDistance              = BGM_FADE_FAR                       // last applied local-Y distance from the camera

	const sfxCache               : Record<string, Entity> = {}        // preloaded sound effect entities
	let lastPlayedSfx            : string | undefined     = undefined // last played sound effect - used to avoid playing the same sound effect twice in a row
	let countdownTimerIds        : number[]               = []        // timer ids for the countdown sounds

	let lastPlayedMusicIndex = Math.floor(Math.random() * sfx.music.length)


	// MARK: init
	/**
	 * Registers the BGM fade system, creates the background-music entity, preloads all SFX
	 * into hidden entities, and wires {@link sys_updateSound}. Safe to call once; later
	 * calls are ignored.
	 */
	export function init(): void {
		if (isInitialized) return
		isInitialized = true

		// BGM is parented to the camera and faded by distance — mutating AudioSource.volume
		// while playing restarts the clip in the current client (sounds like rapid ticks).
		preloadEntity = engine.addEntity()

		bgmEntity = engine.addEntity()
		Transform.create(bgmEntity, {
			parent  : engine.CameraEntity,
			position: Vector3.create(0, BGM_FADE_FAR, 0),
		})
		AudioSource.create(bgmEntity, {
			audioClipUrl: sfx.music[Math.floor(Math.random() * sfx.music.length)],
			loop        : false,
			global      : false,
			playing     : false,
			volume      : BGM_VOLUME,
		})
		bgmDistance = BGM_FADE_FAR

		// Add the sound effect entities
		preloadSfx()

		createToiletSfx()

		engine.addSystem(sys_updateSound)

		// Bind the game start event to start the background music
 		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			startBgm()
		})

		eventBus.on(ClientEvents.GAME_IDLE, () => {
			stopBgm()
		})
	}

	function createToiletSfx() {
		const toiletSfx = engine.addEntity()
		Transform.create(toiletSfx, {
			position: Vector3.create(251.877, 53.65, 280.32),
			scale: Vector3.create(0.1, 0.1, 0.1),
		})
		TriggerArea.setBox(toiletSfx)
		triggerAreaEventsSystem.onTriggerEnter(toiletSfx, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				SoundManager.playSound(sfx.toilet, toiletSfx)
			}
		})
		MeshRenderer.setBox(toiletSfx)
		return toiletSfx
	}


	// MARK: getOrCreatePreloadedClipEntity
	/**
	 * Returns the global preload entity for a clip URL, creating and caching one if missing.
	 * Used during {@link preloadSfx}; also supports {@link playSound} fallback when a clip URL
	 * was introduced after preload or preload missed it.
	 *
	 * @param soundPath - Resolved asset URL (matches {@link sfx} entry strings).
	 */
	function getOrCreatePreloadedClipEntity(soundPath: string): Entity {
		let cached = sfxCache[soundPath]
		if (cached) return cached

		console.log(
			'SoundManager: getOrCreatePreloadedClipEntity: lazily creating missing preload entity for clip:',
			soundPath
		)
		cached = engine.addEntity()
		Transform.create(cached, {})
		AudioSource.create(cached, {
			audioClipUrl: soundPath,
			global      : true,
			playing     : false,
			volume      : SFX_ENTITY_VOLUME,
		})
		sfxCache[soundPath] = cached
		return cached
	}


	// MARK: preloadSfx
	/**
	 * Creates one global {@link AudioSource} per known clip in {@link sfx} so
	 * {@link playSound} can retrigger without loading at play time.
	 */
	function preloadSfx(): void {
		// map eveyr value, from sfx, to an array we can pass
		const sfxArray = Object.values(sfx).reduce(
			(acc, val) => acc.concat(val),
			[]
		)

		console.log('SoundManager: preloadSfx: preloading', sfxArray.length, 'sfx')
		AssetLoad.create(preloadEntity, {
			assets: sfxArray,
		})

		//for (const paths of Object.values(sfx)) {
		//	for (const soundPath of paths) {
		//		
		//		getOrCreatePreloadedClipEntity(soundPath)
		//	}
		//}
	}


	// MARK: isBgmTransitioning
	/**
	 * Whether background music is currently fading in or out. Use to avoid overlapping
	 * logic with {@link startBgm} / {@link stopBgm} while a fade is in progress.
	 *
	 * @returns `true` while BGM is fading in or fading out; `false` when idle.
	 */
	export function isBgmTransitioning(): boolean {
		return bgmFadePhase !== 'idle'
	}


	// MARK: setBgmDistance
	/**
	 * Moves the BGM entity's local Y offset from the camera. Used instead of volume fades
	 * so {@link AudioSource} is not mutated while the clip is playing.
	 *
	 * @param distance - Local Y metres from the camera ({@link BGM_FADE_NEAR} loud … {@link BGM_FADE_FAR} silent).
	 */
	function setBgmDistance(distance: number): void {
		const transform = Transform.getMutableOrNull(bgmEntity)
		if (!transform) return
		bgmDistance          = distance
		transform.position.y = distance
	}


	// MARK: startBgm
	/**
	 * Starts background music: picks the next track from {@link sfx.music}, then fades in by
	 * moving the source toward the camera. If music is already playing (idle or fading in),
	 * does nothing. If a fade-out is in progress, interrupts it and fades back in from the
	 * current distance (same clip — does not retarget the URL mid-play).
	 */
	export function startBgm(): void {
		if (!bgmEntity) return

		const audio = AudioSource.getMutableOrNull(bgmEntity)
		if (!audio) return

		if (audio.playing && bgmFadePhase !== 'fadingOut') return

		const resumingFadeOut = audio.playing && bgmFadePhase === 'fadingOut'

		bgmFadePhase     = 'fadingIn'
		fadeElapsed      = 0
		fadeFromDistance = bgmDistance
		fadeToDistance   = BGM_FADE_NEAR

		if (!resumingFadeOut) {
			lastPlayedMusicIndex += 1
			if (lastPlayedMusicIndex >= sfx.music.length) lastPlayedMusicIndex = 0

			setBgmDistance(BGM_FADE_FAR)
			fadeFromDistance   = BGM_FADE_FAR
			audio.audioClipUrl = sfx.music[lastPlayedMusicIndex]
			audio.playing      = true
		}
	}


	// MARK: stopBgm
	/**
	 * Fades background music out by moving the source away from the camera, then stops
	 * playback. No-op if already stopped at the far distance. Mid fade-in continues from
	 * the current distance (no jump to full loudness).
	 */
	export function stopBgm(): void {
		if (!bgmEntity) return

		const audio = AudioSource.getOrNull(bgmEntity)
		if (!audio) return

		if (!audio.playing && bgmDistance >= BGM_FADE_FAR - 0.01) return

		bgmFadePhase     = 'fadingOut'
		fadeElapsed      = 0
		fadeFromDistance = bgmDistance
		fadeToDistance   = BGM_FADE_FAR
	}


	// MARK: scheduleCountdown
	/**
	 * Schedules one countdown tick for each of the last `numberOfTicks` seconds before
	 * {@link endTime} (Unix ms). Clears any prior countdown first. Skips ticks already in
	 * the past; never schedules a negative timer delay.
	 *
	 * @param endTime - Wall-clock time in milliseconds when the counted period ends (e.g. match start).
	 * @param numberOfTicks - Optional. How many one-second steps before `endTime` each get a sound.
	 *   Defaults to {@link COUNTDOWN_LAST_SECONDS}.
	 */
	export function scheduleCountdown(
		endTime       : number,
		numberOfTicks : number = COUNTDOWN_LAST_SECONDS
	): void {
		cancelCountdown()

		const timeNow = Date.now()
		for (let i = 1; i <= numberOfTicks; i++) {
			const delayMs = endTime - timeNow - i * 1000
			if (delayMs < 0) continue
			countdownTimerIds.push(
				utils.timers.setTimeout(() => {
					playSound(sfx.countdown)
				}, delayMs)
			)
		}
	}


	// MARK: cancelCountdown
	/**
	 * Clears all timers created by {@link scheduleCountdown}. Safe to call when none are
	 * pending.
	 */
	export function cancelCountdown(): void {
		for (const id of countdownTimerIds) {
			utils.timers.clearTimeout(id)
		}
		countdownTimerIds = []
	}


	// MARK: playSound
	/**
	 * Plays a one-shot SFX. Global clips use {@link preloadSfx} entities (lazy-created if missing).
	 * Spatial clips ({@link parentEntity} set) attach a dedicated {@link AudioSource} every play.
	 * Pass a single URL or an array; arrays pick a random clip and avoid repeating the same
	 * pick as the previous call when multiple options exist. Retriggers from the start if the
	 * same clip plays again.
	 *
	 * @param sound - One asset path, or an array of paths (same shape as values in {@link sfx}).
	 */
	export function playSound(
		sound        : string | string[],
		parentEntity?: Entity,
		maxDistance? : number
	): void {
		const list = typeof sound === 'string' ? [sound] : sound

		let randomSound: string
		if (list.length === 1) {
			randomSound = list[0]
		} else {
			do {
				randomSound = list[Math.floor(Math.random() * list.length)]
			} while (randomSound === lastPlayedSfx && list.length > 1)
		}
		lastPlayedSfx = randomSound

		let soundEntity: Entity
		if (parentEntity) {
			const parentT = Transform.getOrNull(parentEntity)
			if (!parentT) return
			
			soundEntity = engine.addEntity()
			Transform.create(soundEntity, { parent: parentEntity })
			AudioSource.create(soundEntity, {
				audioClipUrl: randomSound,
				global      : false,
				playing     : false,
				volume      : SFX_ENTITY_VOLUME,
			})
		} else {
			soundEntity = getOrCreatePreloadedClipEntity(randomSound)
		}

		const audioSrc = AudioSource.getMutableOrNull(soundEntity)
		if (!audioSrc) {
			console.error('SoundManager: playSound: AudioSource missing for clip:', randomSound)
			return
		}

		audioSrc.playing     = false
		audioSrc.currentTime = 0

		if (maxDistance && parentEntity) {
			const playerPos = Transform.getOrNull(engine.PlayerEntity)?.position
			const parentPos = Transform.getOrNull(parentEntity)?.position
			if (!playerPos || !parentPos) return

			const x = playerPos.x - parentPos.x
			const z = playerPos.z - parentPos.z
			const distance = Math.sqrt(x * x + z * z)
			if (distance < maxDistance) {
				const vol = (audioSrc.volume ?? SFX_ENTITY_VOLUME) * (1 - distance / maxDistance)
				console.log(`SoundManager: playSound: ${randomSound} at volume`, vol)
				audioSrc.volume = vol
			}
		}

		utils.timers.setTimeout(() => {
			const audio = AudioSource.getMutableOrNull(soundEntity)
			if (audio) audio.playing = true
		}, 50)
	}


	// MARK: systemUpdateSound
	/**
	 * Engine system: advances BGM fade-in / fade-out by lerping distance from the camera
	 * ({@link FADE_DURATION}). Does not touch {@link AudioSource}.volume while playing.
	 *
	 * @param dt - Delta time in seconds since the last frame.
	 */
	const sys_updateSound = (dt: number): void => {
		if (bgmFadePhase === 'idle' || !bgmEntity) return

		fadeElapsed += dt

		const t        = Math.min(1, fadeElapsed / FADE_DURATION)
		const distance = fadeFromDistance + (fadeToDistance - fadeFromDistance) * t
		setBgmDistance(distance)

		if (t < 1) return

		if (bgmFadePhase === 'fadingOut') {
			const audio = AudioSource.getMutableOrNull(bgmEntity)
			if (audio) audio.playing = false
		}
		bgmFadePhase = 'idle'
	}
}
