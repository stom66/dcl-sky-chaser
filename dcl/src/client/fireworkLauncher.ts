import { Animator, EasingFunction, engine, Entity, GltfContainer, InputAction, ParticleSystem, PBParticleSystem_BlendMode, pointerEventsSystem, Transform, Tween } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"

import { timers } from "src/shared/utils/timers"

import { ParticleSpawner } from "./particleSpawner"
import { sfx, SoundManager } from "./soundManager"
import { ClientMessaging } from "./clientMessaging"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { IS_DEV } from "src/shared/settings"

export namespace FireworkLauncher {

	const ANIMATION_ACTION_NAME     = "Action"
	const CH_TAG_NAME               = "fireworkButton"

	const ORIGIN_PARTICLE           = Vector3.create(-0.02363	, 0.837015, 0)

	const PARTICLE_DELAY            = 3.5 // seconds
	const MAX_INTERACTION_DISTANCE  = IS_DEV ? 20 : 3

	const entityIdMap: Map<string, Entity> = new Map()


	// MARK: init
    export function init() {
        console.log('fireworkLauncher: init()')

		// Find the model
		
		const entities = engine.getEntitiesByTag(CH_TAG_NAME)
		
		for (const entity of entities) {
			// Add a pointerSystem so players can interact with it
			entityIdMap.set(entity.toString(), entity)

			pointerEventsSystem.onPointerDown({
				entity: entity,
				opts: { 
					button     : InputAction.IA_POINTER, 
					hoverText  : "Interact", 
					maxDistance: MAX_INTERACTION_DISTANCE
				}
			}, () => {
				requestLaunchFirework(entity)
			})
		}

		eventBus.on(ClientEvents.NOTIFY_FIREWORK_LAUNCHED, (data) => { 
			const entity = entityIdMap.get(data.entityId)
			if (!entity) return
			launchFirework(entity) 
		})
    }

	function requestLaunchFirework(entity: Entity) {
		console.log('requestLaunchFirework')
		ClientMessaging.RequestLaunchFirework(entity.toString())
	}


	// MARK: launchFirework
	function launchFirework(entity: Entity) {
		console.log('launchFirework')

		// Trigger the animation
		Animator.playSingleAnimation(entity, ANIMATION_ACTION_NAME, true)

		// Trigger sfx
		SoundManager.playSound(sfx.fireworkButton, entity, 35)

		// Get the world position of the particle spawn point
		const transform = Transform.getOrNull(entity)
		if (!transform) return

		const localPos = Vector3.multiply(Vector3.rotate(ORIGIN_PARTICLE, transform.rotation), transform.scale)
		const worldPos = Vector3.add(transform.position, localPos)

		timers.setTimeout(() => {
			spawnParticleFirework(worldPos)
		}, PARTICLE_DELAY * 1000)
	}


	// MARK: spawnParticleFirework
	export function spawnParticleFirework(worldPos: Vector3) {
		const LIFESPAN = 1.5
		const RISE_SPEED = 20


		const pRoot = engine.addEntity()
		Transform.create(pRoot, {
			position: worldPos,
			rotation: Quaternion.fromEulerDegrees(0, 90, 0)
		})

		GltfContainer.create(pRoot, { src: 'assets/models/birdFirework.gltf' })

		const r1 = 0.35
		const r2 = 0.65
		const totalHeight = RISE_SPEED * LIFESPAN
		const boostHeight = 1.5

		const firstWaypoint = Vector3.add(worldPos, Vector3.create(0, boostHeight, 0))
		const secondWaypoint = Vector3.add(worldPos, Vector3.create(0, totalHeight, 0))

		// First we bounce up, slow, then rocket upwards
		Tween.setMove(pRoot, worldPos, firstWaypoint, LIFESPAN * 1000 * r1, EasingFunction.EF_EASEOUTBACK)
		ParticleSpawner.TriggerFeathers(Vector3.center(worldPos, firstWaypoint))

		
		const particleSmokeTrail = engine.addEntity()
		Transform.create(particleSmokeTrail, { 
			parent  : pRoot, 
			position: Vector3.create(0, -0.25, 0),
			rotation: Quaternion.fromEulerDegrees(-90, 0, 0) 
		})


		// Start second leg, start emitting particles
		timers.setTimeout(() => {
			
			SoundManager.playSound(sfx.fireworkLaunch, pRoot, 80)

			Tween.setMove(pRoot, firstWaypoint, secondWaypoint, LIFESPAN * 1000 * r2, EasingFunction.EF_EASEINSINE)

			ParticleSystem.create(particleSmokeTrail, {
				active              : true,
				loop                : true,
				prewarm             : false,
				faceTravelDirection : false,
				rate                : 300,
				lifetime            : LIFESPAN / 2,
				maxParticles        : 300,
				gravity             : 6,
				blendMode           : PBParticleSystem_BlendMode.PSB_ALPHA,
				shape               : ParticleSystem.Shape.Cone({ angle: 60, radius: 0.2 }),
				initialVelocitySpeed: { start: 0, end: -15 },
				initialSize         : { start: 0.25, end: 1.5 },
				sizeOverTime        : { start: 1, end: 0 },
				initialColor        : { start: Color4.fromHexString("#ffffff"), end: Color4.fromHexString("#cccccc") },
				billboard           : true,
				texture             : { src: 'assets/sprites/sprites-dust.png' },
				spriteSheet         : { tilesX: 6, tilesY: 6, framesPerSecond: 36},
			})
		}, LIFESPAN * 1000 * r1)

		timers.setTimeout(() => {
			// Remove the pigeon and its trail
			ParticleSystem.deleteFrom(particleSmokeTrail)
			engine.removeEntity(particleSmokeTrail)
			GltfContainer.deleteFrom(pRoot)

			const transform = Transform.getOrNull(pRoot)
			if (transform) {	
				// Spawn the explosion particles - 3 times for different colors
				for (let i = 0; i < 3; i++) {
					ParticleSpawner.TriggerFireworks(transform.position)
				}
			}

			SoundManager.playSound(sfx.coo, pRoot, 80)

			timers.setTimeout(() => {
				engine.removeEntity(pRoot)
			}, 5000)
		}, LIFESPAN * 1000)
	}
}