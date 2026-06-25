import { engine, Entity, InputAction, inputSystem, ParticleSystem, PBParticleSystem_BlendMode, Transform } from "@dcl/sdk/ecs";
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { ComponentStore } from "src/shared/components/componentStore";
import * as utils from '@dcl-sdk/utils'
import { ClientEvents, eventBus } from "src/shared/utils/eventBus";


export namespace ParticleSpawner {

	var entity: Entity | null = null

	var isEnabled = false

	export function init() {
		entity = engine.addEntity()
		Transform.create(entity, { 
			parent: engine.PlayerEntity,
			position: Vector3.create(0,1,-0.1),
			rotation: Quaternion.fromEulerDegrees(30, 180, 0)
		})	
		engine.addSystem(systemInputWatcher)

		eventBus.on(ClientEvents.NOTIFY_TRIGGER, (data) => {
			triggerEffect(data?.effect, data?.position ?? Vector3.create(256, 63.2, 256), data?.direction ?? Vector3.Zero())
		})

		eventBus.on(ClientEvents.TRIGGER_AWNING, (data) => {
			triggerEffect(ClientEvents.TRIGGER_AWNING, data?.position ?? Vector3.create(256, 63.2, 256), data?.direction ?? Vector3.Zero())
		})
		eventBus.on(ClientEvents.TRIGGER_TRAMPOLINE, (data) => {
			triggerEffect(ClientEvents.TRIGGER_TRAMPOLINE, data?.position ?? Vector3.create(256, 63.2, 256), data?.direction ?? Vector3.Zero())
		})
		eventBus.on(ClientEvents.TRIGGER_UMBRELLA, (data) => {
			triggerEffect(ClientEvents.TRIGGER_UMBRELLA, data?.position ?? Vector3.create(256, 63.2, 256), data?.direction ?? Vector3.Zero())
		})

		eventBus.on(ClientEvents.TRIGGER_RING, (data) => {
			triggerEffect(ClientEvents.TRIGGER_RING, data?.position ?? Vector3.create(256, 63.2, 256), Vector3.create(0, data?.yRot ?? 0, 0))
		})
		eventBus.on(ClientEvents.TRIGGER_FUEL, (data) => {
			triggerEffect(ClientEvents.TRIGGER_FUEL, data?.position ?? Vector3.create(256, 63.2, 256), data?.direction ?? Vector3.Zero())
		})
		eventBus.on(ClientEvents.TRIGGER_BALLOON, (data) => {
			triggerEffect(ClientEvents.TRIGGER_BALLOON, data?.position ?? Vector3.create(256, 63.2, 256), data?.direction ?? Vector3.Zero())
		})

		eventBus.on(ClientEvents.TRIGGER_EXPLOSION, (data) => {
			triggerEffect(ClientEvents.TRIGGER_EXPLOSION, data?.position ?? Vector3.create(256, 63.2, 256), Vector3.Zero())
		})

		eventBus.on(ClientEvents.FOUND_ALL_PIGEONS, (data) => {
			TriggerPigeonSpurt(Transform.getOrNull(engine.PlayerEntity)?.position ?? Vector3.create(256, 63.2, 256))
		})
	}


	function triggerEffect(effect: ClientEvents, position: Vector3, direction: Vector3) {
		switch (effect) {
			case ClientEvents.TRIGGER_AWNING:
				TriggerDustSpurt(position)
				break
			case ClientEvents.TRIGGER_TRAMPOLINE:
				TriggerDustSpurt(position)
				break
			case ClientEvents.TRIGGER_UMBRELLA:
				TriggerDustSpurt(position)
				break
			case ClientEvents.TRIGGER_RING:
				TriggerPickupSpeedRing(position, direction.y)
				break
			case ClientEvents.TRIGGER_FUEL:
				TriggerPickupFuel(position)
				break
			case ClientEvents.TRIGGER_BALLOON:
				TriggerPickupBalloon(position)
				break
			case ClientEvents.TRIGGER_EXPLOSION:
				TriggerExplosion(position)
				break
		}
	} 

	function createParticleSystem() {
		if (!entity) return

		console.log("ParticleSpawner: creating particle system")

		ParticleSystem.create(entity, {
			active              : true,
			loop                : true,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 200,
			lifetime            : 2,
			maxParticles        : 400,
			gravity             : 0,
			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Cone({ 
				angle : 15, 
				radius: 0.05 
			}),
			initialVelocitySpeed: { 
				start: 3, 
				end  : 6 
			},
			initialSize: { 
				start: 0.08, 
				end  : 0.18 
			},
			sizeOverTime: { 
				start: 1, 
				end  : 0 
			},
			initialColor: { 
				start: Color4.create(0.827, 0.604, 0.125, 1.000), 
				end  : Color4.create(0.800, 0.800, 0.800, 1.000) 
			},
			colorOverTime: { 
				start: Color4.create(1.000, 0.800, 0.500, 1.000), 
				end  : Color4.create(0.200, 0.200, 0.200, 1.000) 
			},
		})
	}

	function setActive(active: boolean) {
		if (!entity) return

		if (active) {
			if (!entity) return
			createParticleSystem()
		} else {
			const p = ParticleSystem.getOrNull(entity)
			if (!p) return
			console.log("ParticleSpawner: deleting particle system")
			ParticleSystem.deleteFrom(entity)
		}
	}

	function systemInputWatcher(dt: number) {
		const isEPressed = inputSystem.isPressed(InputAction.IA_PRIMARY)

		if (isEPressed && !isEnabled) {
			isEnabled = true
			console.log("ParticleSpawner: setting active to true")
			setActive(true)
		} else if (!isEPressed && isEnabled) {
			isEnabled = false
			console.log("ParticleSpawner: setting active to false")
			setActive(false)
		}
		
		if (isEPressed && isEnabled) {
			const fuelLevel = ComponentStore.getFuelValue().value
			if (fuelLevel <= 0) {
				setActive(false)
			}
		}
	}

	// MARK: Explosion
	export function TriggerExplosion(
		position: Vector3
	) {
		const entity = engine.addEntity()
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 0.5,
			maxParticles        : 300,
			gravity             : 2,
			blendMode           : PBParticleSystem_BlendMode.PSB_ALPHA,
			shape               : ParticleSystem.Shape.Point({}),
			initialVelocitySpeed: { start: 10, end: 40 },
			initialSize         : { start: 0.5, end: 8 },
			sizeOverTime        : { start: 1, end: 0 },
			initialColor        : { start: Color4.fromHexString("#ffffff"), end: Color4.fromHexString("#cccccc") },
			//colorOverTime       : { start: Color4.create(1.000, 0.800, 0.500, 1.000), end: Color4.create(0.800, 0.200, 0.000, 0.000) },
			bursts              : { values: [
				{ time: 0, count: 64, cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/tex/particles-explosion.png' },
			spriteSheet         : { tilesX: 2, tilesY: 2, framesPerSecond: 10},
		})

		utils.timers.setTimeout(() => {
			ParticleSystem.deleteFrom(entity)
			engine.removeEntity(entity)
		}, 2000)

	}

	// MARK: Dust
	export function TriggerDustSpurt(
		position: Vector3
	) {
		const entity = engine.addEntity()
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 2,
			maxParticles        : 300,
			gravity             : 6,
			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Cone({ angle: 30, radius: 0.2 }),
			initialVelocitySpeed: { start: 12.5, end: 17.5 },
			initialSize         : { start: 0.25, end: 0.75 },
			sizeOverTime        : { start: 1, end: 0 },
			//rotationOverTime    : { x: 0, y: 0, z: 0, w: 1 },
			initialColor        : { start: Color4.fromHexString("#ffffff"), end: Color4.fromHexString("#cccccc") },
			//colorOverTime       : { start: Color4.create(1.000, 0.800, 0.500, 1.000), end: Color4.create(0.800, 0.200, 0.000, 0.000) },
			bursts              : { values: [
				{ time: 0, count: 64, cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/tex/particles-dust.png' },
			spriteSheet         : { tilesX: 2, tilesY: 2, framesPerSecond: 10},
		})

		utils.timers.setTimeout(() => {
			ParticleSystem.deleteFrom(entity)
			engine.removeEntity(entity)
		}, 2000)

	}

	// MARK: Pigeons
	export function TriggerPigeonSpurt(
		position: Vector3
	) {
		const entity = engine.addEntity()
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 2,
			maxParticles        : 300,
			gravity             : 4,
			//blendMode           : PBParticleSystem_BlendMode.PSB_ALPHA,
			shape               : ParticleSystem.Shape.Cone({ angle: 30, radius: 0.2 }),
			initialVelocitySpeed: { start: 12.5, end: 20 },
			initialSize         : { start: 0.25, end: 0.75 },
			sizeOverTime        : { start: 1, end: 0 },
			//rotationOverTime    : { x: 0, y: 0, z: 0, w: 1 },
			initialColor        : { start: Color4.fromHexString("#ffffffff"), end: Color4.fromHexString("#ffffffff") },
			//colorOverTime       : { start: Color4.create(1.000, 0.800, 0.500, 1.000), end: Color4.create(0.800, 0.200, 0.000, 0.000) },
			bursts              : { values: [
				{ time: 0, count: 32, cycles: 6, interval: 0.8, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/tex/particles-pigeons.png' },
			spriteSheet         : { tilesX: 2, tilesY: 2, framesPerSecond: 10},
		})

		utils.timers.setTimeout(() => {
			ParticleSystem.deleteFrom(entity)
			engine.removeEntity(entity)
		}, 2000)

	}

	// MARK: Pickups
	export function TriggerPickupFuel(
		position: Vector3
	) {
		TriggerPickup(position, Color4.fromHexString("#55dd55"), "assets/tex/particles-fuel.png")
	}
	export function TriggerPickupBalloon(
		position: Vector3
	) {
		TriggerPickup(position, Color4.fromHexString("#dddd55"), "assets/tex/particles-fuel.png")
	}

	export function TriggerPickup(
		position: Vector3,
		startColor: Color4,
		texture: string,
	) {
		const entity = engine.addEntity()
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 2,
			maxParticles        : 300,
			gravity             : 6,
			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Cone({ angle: 30, radius: 0.2 }),
			initialVelocitySpeed: { start: 12.5, end: 17.5 },
			initialSize         : { start: 0.25, end: 0.75 },
			sizeOverTime        : { start: 1, end: 0 },
			//rotationOverTime    : { x: 0, y: 0, z: 0, w: 1 },
			initialColor        : { start: Color4.fromHexString("#ffffff"), end: Color4.fromHexString("#cccccc") },
			//colorOverTime       : { start: Color4.create(1.000, 0.800, 0.500, 1.000), end: Color4.create(0.800, 0.200, 0.000, 0.000) },
			bursts              : { values: [
				{ time: 0, count: 64, cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/tex/particles-dust.png' },
			spriteSheet         : { tilesX: 2, tilesY: 2, framesPerSecond: 10},
		})

		utils.timers.setTimeout(() => {
			ParticleSystem.deleteFrom(entity)
			engine.removeEntity(entity)
		}, 2000)

	}

	// MARK: Speed Rings
	export function TriggerPickupSpeedRing(
		position: Vector3,
		yRot: number,
	) {
		const entity = engine.addEntity()
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-45, yRot, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 2,
			maxParticles        : 200,
			gravity             : 2,
			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Cone({ angle: 15, radius: 0.2 }),
			initialVelocitySpeed: { start: 25, end: 45 },
			
			initialSize         : { start: 0.25, end: 0.75 },
			sizeOverTime        : { start: 1, end: 0 },
			//rotationOverTime    : { x: 0, y: 0, z: 0, w: 1 },
			initialColor        : { start: Color4.fromHexString("#00aadd"), end: Color4.fromHexString("#cccccc") },
			//colorOverTime       : { start: Color4.create(1.000, 0.800, 0.500, 1.000), end: Color4.create(0.800, 0.200, 0.000, 0.000) },
			bursts              : { values: [
				{ time: 0, count: 64, cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/tex/particles-dust.png' },
			spriteSheet         : { tilesX: 2, tilesY: 2, framesPerSecond: 10},
		})

		utils.timers.setTimeout(() => {
			ParticleSystem.deleteFrom(entity)
			engine.removeEntity(entity)
		}, 2000)
	}
}