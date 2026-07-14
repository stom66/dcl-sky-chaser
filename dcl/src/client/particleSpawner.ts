import { engine, Entity, InputAction, inputSystem, ParticleSystem, PBParticleSystem_BlendMode, PBParticleSystem_SimulationSpace, TextureFilterMode, Transform } from "@dcl/sdk/ecs";
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { ComponentStore } from "src/shared/components/componentStore";
import * as utils from '@dcl-sdk/utils'
import { ClientEvents, eventBus } from "src/shared/utils/eventBus";


export namespace ParticleSpawner {

	var entityBooster: Entity | null = null
	var entityWind: Entity | null = null

	var isEnabled = false

	export function init() {
		entityBooster = engine.addEntity()
		Transform.create(entityBooster, { 
			parent: engine.PlayerEntity,
			position: Vector3.create(0,1,-0.1),
			rotation: Quaternion.fromEulerDegrees(30, 180, 0)
		})	

		entityWind = engine.addEntity()
		Transform.create(entityWind, { 
			parent: engine.CameraEntity,
			position: Vector3.create(0,0,10),
			rotation: Quaternion.fromEulerDegrees(0, 180, 0),
			scale: Vector3.create(4, 1, 1)
		})	

		const zero = Vector3.Zero()

		// Remotely triggered effects
		eventBus.on(ClientEvents.NOTIFY_TRIGGER, (data)     => {
			triggerEffect(data?.effect, data?.position ?? zero, data?.direction ?? zero)
		})

		// Locally triggered effects
		eventBus.on(ClientEvents.PLAYER_COLLIDED_AWNING, (data)     => {
			triggerEffect(ClientEvents.PLAYER_COLLIDED_AWNING, data?.position ?? zero, data?.direction ?? zero)
		})
		eventBus.on(ClientEvents.PLAYER_COLLIDED_TRAMPOLINE, (data) => {
			triggerEffect(ClientEvents.PLAYER_COLLIDED_TRAMPOLINE, data?.position ?? zero, data?.direction ?? zero)
		})
		eventBus.on(ClientEvents.PLAYER_COLLIDED_UMBRELLA, (data)   => {
			triggerEffect(ClientEvents.PLAYER_COLLIDED_UMBRELLA, data?.position ?? zero, data?.direction ?? zero)
		})

		eventBus.on(ClientEvents.PLAYER_COLLIDED_RING, (data)       => {
			triggerEffect(ClientEvents.PLAYER_COLLIDED_RING, data?.position ?? zero, Vector3.create(0, data?.yRot ?? 0, 0))
		})
		eventBus.on(ClientEvents.PLAYER_COLLIDED_FUEL, (data)       => {
			triggerEffect(ClientEvents.PLAYER_COLLIDED_FUEL, data?.position ?? zero)
		})

		eventBus.on(ClientEvents.PLAYER_COLLIDED_BALLOON, (data)    => {
			triggerEffect(ClientEvents.PLAYER_COLLIDED_BALLOON, data?.position ?? zero)
		})

		eventBus.on(ClientEvents.PROJECTILE_HIT_BALLOON, (data)  => {
			triggerEffect(ClientEvents.PROJECTILE_HIT_BALLOON, data?.position ?? zero)
		})

		eventBus.on(ClientEvents.PROJECTILE_HIT_FUEL, (data)  => {
			triggerEffect(ClientEvents.PROJECTILE_HIT_FUEL, data?.position ?? zero, zero)
		})

		eventBus.on(ClientEvents.PLAYER_FOUND_ALL_PIGEONS, (data)  => {
			TriggerPigeonSpurt(Transform.getOrNull(engine.PlayerEntity)?.position ?? zero)
		})

		engine.addSystem(systemInputWatcher)

		//enableWind() // DEBUG
	}

	function systemInputWatcher(dt: number) {
		const isEPressed = inputSystem.isPressed(InputAction.IA_PRIMARY)

		if (isEPressed && !isEnabled) {
			isEnabled = true
			console.log("ParticleSpawner: setting active to true")
			enableBooster()
			//enableWind()
		} else if (!isEPressed && isEnabled) {
			isEnabled = false
			console.log("ParticleSpawner: setting active to false")
			disableBooster()
			//disableWind()
		}
		
		if (isEPressed && isEnabled) {
			const fuelLevel = ComponentStore.getFuelValue().value
			if (fuelLevel <= 0) {
				disableBooster()
			}
		}
	}


	function triggerEffect(
		effect   : ClientEvents, 
		position : Vector3, 
		direction: Vector3 = Vector3.Zero()
	) {
		switch (effect) {
			case ClientEvents.PLAYER_COLLIDED_AWNING:
				TriggerDustSpurt(position)
				break
			case ClientEvents.PLAYER_COLLIDED_TRAMPOLINE:
				TriggerDustSpurt(position)
				break
			case ClientEvents.PLAYER_COLLIDED_UMBRELLA:
				TriggerDustSpurt(position)
				break
			case ClientEvents.PLAYER_COLLIDED_BALLOON:
			case ClientEvents.PROJECTILE_HIT_BALLOON:
				TriggerPickupBalloon(position)
				break
			case ClientEvents.PLAYER_COLLIDED_RING:
				TriggerPickupSpeedRing(position, direction.y)
				break
			case ClientEvents.PLAYER_COLLIDED_FUEL:
				TriggerPickupFuel(position)
				break
			case ClientEvents.PROJECTILE_HIT_FUEL:
				TriggerExplosion(position)
				break
		}
	} 


	// MARK: Booster
	function enableBooster() {
		if (!entityBooster) return

		console.log("ParticleSpawner: creating particle system")

		ParticleSystem.create(entityBooster, {
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

	function disableBooster() {
		if (!entityBooster) return
		const p = ParticleSystem.getOrNull(entityBooster)
		if (!p) return

		console.log("ParticleSpawner: deleting particle system")
		ParticleSystem.deleteFrom(entityBooster)
	}


	// MARK: Wind
	function enableWind() {
		if (!entityWind) return

		console.log("ParticleSpawner: creating WIND particle system")

		ParticleSystem.create(entityWind, {
			active              : true,
			loop                : true,
			prewarm             : false,
			faceTravelDirection : true,
			rate                : 10,
			lifetime            : 3,
			maxParticles        : 50,
			gravity             : 0,
			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Cone({ 
				angle : 25, 
				radius: 0.1 
			}),
			initialVelocitySpeed: { 
				start: 2.5, 
				end  : 7.5 
			},
			initialSize: { 
				start: 2, 
				end  : 2 
			},
			initialColor: { 
				start: Color4.White(), 
				end  : Color4.White() 
			},
			sizeOverTime: { 
				start: 1, 
				end  : 1 
			},
			texture             : { src: 'assets/tex/particles-wind.png',
				filterMode: TextureFilterMode.TFM_POINT,
			 },
			billboard           : true,
			spriteSheet         : { tilesX: 1, tilesY: 4, framesPerSecond: 2, },
			initialRotation     : Quaternion.fromEulerDegrees(-90, -90, 0),
			simulationSpace     : PBParticleSystem_SimulationSpace.PSS_WORLD,
			
		})
	}

	function disableWind() {
		if (!entityBooster) return
		const p = ParticleSystem.getOrNull(entityBooster)
		if (!p) return

		console.log("ParticleSpawner: deleting particle system")
		ParticleSystem.deleteFrom(entityBooster)
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
		TriggerPickup(position, "assets/tex/particles-fuel.png", Color4.fromHexString("#55dd55"), Color4.fromHexString("#ffffff"))
	}
	export function TriggerPickupBalloon(
		position: Vector3
	) {
		TriggerPickup(position, "assets/tex/particles-dust.png", Color4.fromHexString("#FFFC00"), Color4.fromHexString("#FF7800"))
	}

	export function TriggerPickup(
		position   : Vector3,
		texture    : string,
		startColor: Color4 = Color4.fromHexString("#FFFFFF"),
		endColor  : Color4 = Color4.fromHexString("#FFFFFF"),
	) {
		const entity = engine.addEntity()
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 0.75,
			
			maxParticles        : 300,
			gravity             : 2,
			blendMode           : PBParticleSystem_BlendMode.PSB_ALPHA,
			shape               : ParticleSystem.Shape.Point({}),
			initialVelocitySpeed: { start: 7.5, end: 15 },
			initialSize         : { start: 0.125, end: 1 },
			sizeOverTime        : { start: 1, end: 0 },
			//rotationOverTime    : { x: 0, y: 0, z: 0, w: 1 },
			initialColor        : { start: startColor, end: endColor },
			//colorOverTime       : { start: Color4.create(1.000, 0.800, 0.500, 1.000), end: Color4.create(0.800, 0.200, 0.000, 0.000) },
			bursts              : { values: [
				{ time: 0, count: 64, cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: texture },
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