import { Animator, EasingFunction, engine, Entity, GltfContainer, InputAction, ParticleSystem, ParticleSystemBlendMode, PBParticleSystem_BlendMode, pointerEventsSystem, Transform, Tween, TweenSequence } from "@dcl/sdk/ecs"
import { sfx, SoundManager } from "./soundManager"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { timers } from "src/shared/utils/timers"
import { ParticleSpawner } from "./particleSpawner"
import { IS_DEV } from "@stom66/dcl-ui-component-kit"

export namespace FireworkLauncher {

	const timeLastPlayed: Map<Entity, number> = new Map()

	const ANIMATION_ACTION_NAME     = "Action"

	const ORIGIN_PARTICLE           = Vector3.create(-0.02363	, 0.837015, 0)

	const PARTICLE_DELAY            = 3.5 // seconds
	const COOLDOWN_TIME             = 10  // seconds
	const MAX_INTERACTION_DISTANCE  = IS_DEV ? 20 : 3

    export function init() {
        console.log('fireworkLauncher: init()')

		// Find the model
		
		const entities = engine.getEntitiesByTag("fireworkButton")
		
		for (const entity of entities) {
			// Add a pointerSystem so players can interact with it

			pointerEventsSystem.onPointerDown({
				entity: entity,
				opts: { 
					button     : InputAction.IA_POINTER, 
					hoverText  : "Interact", 
					maxDistance: MAX_INTERACTION_DISTANCE
				}
			}, () => {
				launchFirework(entity)
			})
		}
    }

	function launchFirework(entity: Entity) {
		console.log('launchFirework')

		const t = timeLastPlayed.get(entity) || 0
		if (t + (COOLDOWN_TIME * 1000) > Date.now()) return

		timeLastPlayed.set(entity, Date.now())

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


	export function spawnParticleFirework(worldPos: Vector3) {
		const LIFESPAN = 1.5
		const RISE_SPEED = 20


		const pRoot = engine.addEntity()
		Transform.create(pRoot, {
			position: worldPos,
		})

		GltfContainer.create(pRoot, { src: 'assets/models/birdFirework.gltf' })

		Tween.setMove(pRoot, worldPos, Vector3.add(worldPos, Vector3.create(0, RISE_SPEED * LIFESPAN, 0)), LIFESPAN * 1000, EasingFunction.EF_EASEINCIRC)



		const particleSmokeTrail = engine.addEntity()
		Transform.create(particleSmokeTrail, { parent: pRoot, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })

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
			texture             : { src: 'assets/tex/sprites-dust.png' },
			spriteSheet         : { tilesX: 6, tilesY: 6, framesPerSecond: 36},
		})

		timers.setTimeout(() => {
			ParticleSystem.deleteFrom(particleSmokeTrail)
			engine.removeEntity(particleSmokeTrail)
			GltfContainer.deleteFrom(pRoot)

			const transform = Transform.getOrNull(pRoot)
			if (!transform) return 
			
			ParticleSpawner.TriggerDustSpurt(transform.position)
			ParticleSpawner.TriggerExplosion(transform.position, 80, 16)

			SoundManager.playSound(sfx.boom, pRoot, 80)

			timers.setTimeout(() => {
				engine.removeEntity(pRoot)
			}, 3000)
		}, LIFESPAN * 1000)
	}
}