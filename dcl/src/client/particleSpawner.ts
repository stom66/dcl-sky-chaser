import { engine, Entity, InputAction, inputSystem, ParticleSystem, PBParticleSystem_BlendMode, PBParticleSystem_LimitVelocity, PBParticleSystem_SimulationSpace, TextureFilterMode, Transform } from "@dcl/sdk/ecs";
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { AssetLoad } from "@dcl/sdk/ecs"
import * as utils from '@dcl-sdk/utils'


import { ComponentStore } from "src/shared/components/componentStore";
import { ClientEvents, eventBus } from "src/shared/utils/eventBus";
import { isMobile } from "@dcl/sdk/platform";


export namespace ParticleSpawner {

	var entityBooster         : Entity | null = null
	var entityBoosterWindRoot : Entity | null = null
	var entityEnvWindRoot     : Entity | null = null
	var boosterWindEntities   : Entity[]      = []
	var envWindEntities       : Entity[]      = []

	var isEnabled = false

	const BOOSTER_WIND_SPRITES = [
		'assets/sprites/sprites-wind-02.png',
		'assets/sprites/sprites-wind-03.png',
		'assets/sprites/sprites-wind-04.png',
		'assets/sprites/sprites-wind-05.png',
		'assets/sprites/sprites-wind-06.png',
	]

	const ENV_WIND_SPRITES = [
		'assets/sprites/sprites-wind-05.png',
		'assets/sprites/sprites-wind-06.png',
	]

	const COLOR_PALETTE = [
		Color4.Red(),
		Color4.Green(),
		Color4.Blue(),
		Color4.Yellow(),
		Color4.Purple(),
		Color4.Magenta(),
		Color4.Teal(),
	]

	export function init() {
		entityBooster = engine.addEntity()
		Transform.create(entityBooster, { 
			parent  : engine.PlayerEntity,
			position: Vector3.create(0,1,-0.1),
			rotation: Quaternion.fromEulerDegrees(30, 180, 0)
		})	

		entityBoosterWindRoot = engine.addEntity()
		Transform.create(entityBoosterWindRoot, { 
			parent  : engine.PlayerEntity,
			position: Vector3.create(0, 1, 10),
			rotation: Quaternion.fromEulerDegrees(0, 180, 0),
			scale   : Vector3.create(4, 1, 1)
		})	

		entityEnvWindRoot = engine.addEntity()
		Transform.create(entityEnvWindRoot, {
			parent  : engine.PlayerEntity,
			position: Vector3.create(0, 0, 0),
			rotation: Quaternion.fromEulerDegrees(-90, 0, 0),
			scale   : Vector3.create(1, 1, 1)
		})

		createBoosterWind()
		createEnvWind()

		preloadAssets()

		const zero = Vector3.Zero()

		
		// MARK: eventBus binds
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

		engine.addSystem(sys_inputWatcher)
	}


	//MARK: sys_inputWatcher
	function sys_inputWatcher(dt: number) {
		const isEPressed = inputSystem.isPressed(InputAction.IA_PRIMARY)

		const spectatorModeEnabled = ComponentStore.getSpectatorModeEnabled()
		if (spectatorModeEnabled) return

		
		const fuelLevel = ComponentStore.getFuelValue().value

		if (isEPressed && !isEnabled && fuelLevel > 1) {
			isEnabled = true
			console.log("ParticleSpawner: setting active to true")
			enableBooster()
			enableBoosterWind()
		} else if (!isEPressed && isEnabled) {
			isEnabled = false
			console.log("ParticleSpawner: setting active to false")
			disableBooster()
			disableBoosterWind()
		}
		
		if (isEPressed && isEnabled) {
			if (fuelLevel <= 1) {
				disableBooster()
			}
		}
	}


	//MARK: preloadAssets
	function preloadAssets() {
		AssetLoad.create(engine.RootEntity, {
		  assets: [
			"assets/sprites/sprites-dust.png",
			"assets/sprites/sprites-explosion.png",
			"assets/sprites/sprites-fabric.png",
			"assets/sprites/sprites-fireworkd.png",
			"assets/sprites/sprites-feathers.png",
			"assets/sprites/sprites-fuel.png",
			"assets/sprites/sprites-sparkles.png",
			"assets/sprites/sprites-speed.png",
			"assets/sprites/sprites-wind-02.png",
			"assets/sprites/sprites-wind-03.png",
			"assets/sprites/sprites-wind-04.png",
			"assets/sprites/sprites-wind-05.png",
			"assets/sprites/sprites-wind-06.png",
			"assets/sprites/sprites-wind-05.png",
			"assets/sprites/sprites-wind-06.png",
		  ],
		})
	}

	function getParticleRatio() {
		return isMobile() ? 0.5 : 1.0
	}


	//MARK: triggerEffect
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
				TriggerDustSpurt(position)
				break
			case ClientEvents.PLAYER_COLLIDED_RING:
				TriggerPickupSpeedRing(position, direction.y)
				break
			case ClientEvents.PLAYER_COLLIDED_FUEL:
				TriggerPickupFuel(position)
				TriggerDustSpurt(position)
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


	// MARK: createBoosterWind
	function createBoosterWind() {
		if (!entityBoosterWindRoot) return
		if (boosterWindEntities.length > 0) return

		console.log("ParticleSpawner: createBoosterWind: creating booster wind particle systems")

		for (const sprite of BOOSTER_WIND_SPRITES) {
			const entity = engine.addEntity()
			Transform.create(entity, { parent: entityBoosterWindRoot })
			addBoosterWind(entity, sprite)
			boosterWindEntities.push(entity)
		}
	}


	// MARK: addBoosterWind
	function addBoosterWind(
		entity: Entity,
		sprite: string
	) {
		const startZ = Math.random() * 360
		const spinZ  = (Math.random() < 0.5 ? -1 : 1) * (15 + Math.random() * 45)

		ParticleSystem.create(entity, {
			active              : false,
			loop                : true,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 20 * getParticleRatio(),
			lifetime            : 3,
			maxParticles        : 200 * getParticleRatio(),
			gravity             : 0,
			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Box({
				size: Vector3.create(19, 10, 1)
			}),
			initialVelocitySpeed: {
				start: 12.5,
				end  : 47.5
			},
			initialSize: {
				start: 0.025,
				end  : 0.5
			},
			initialColor: {
				start: Color4.White(),
				end  : Color4.White()
			},
			sizeOverTime: {
				start: 1,
				end  : 0
			},
			initialRotation : Quaternion.fromEulerDegrees(0, 0, startZ),
			rotationOverTime: Quaternion.fromEulerDegrees(0, 0, spinZ),
			texture: {
				src       : sprite,
				filterMode: TextureFilterMode.TFM_POINT,
			},
			billboard      : true,
			simulationSpace: PBParticleSystem_SimulationSpace.PSS_WORLD,
		})
	}


	// MARK: setBoosterWindActive
	function setBoosterWindActive(
		active: boolean
	) {
		for (const entity of boosterWindEntities) {
			const p = ParticleSystem.getMutableOrNull(entity)
			if (!p) continue
			p.active = active
		}
	}


	// MARK: enableBoosterWind
	function enableBoosterWind() {
		console.log("ParticleSpawner: enableBoosterWind: setting active to true")
		setBoosterWindActive(true)
	}


	// MARK: disableBoosterWind
	function disableBoosterWind() {
		console.log("ParticleSpawner: disableBoosterWind: setting active to false")
		setBoosterWindActive(false)
	}


	// MARK: createEnvWind
	function createEnvWind() {
		if (!entityEnvWindRoot) return
		if (envWindEntities.length > 0) return

		console.log("ParticleSpawner: createEnvWind: creating environmental wind particle systems")

		for (const sprite of ENV_WIND_SPRITES) {
			const entity = engine.addEntity()
			Transform.create(entity, { parent: entityEnvWindRoot })
			addEnvWind(entity, sprite)
			envWindEntities.push(entity)
		}
	}


	// MARK: addEnvWind
	function addEnvWind(
		entity: Entity,
		sprite: string
	) {
		const startZ = Math.random() * 360
		const spinZ  = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 30)

		ParticleSystem.create(entity, {
			active              : true,
			loop                : true,
			prewarm             : true,
			faceTravelDirection : false,
			rate                : 1 * getParticleRatio(),
			lifetime            : 20,
			maxParticles        : 40 * getParticleRatio(),
			gravity             : -5,
			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Box({
				size: Vector3.create(6, 6, 0.5)
			}),
			initialVelocitySpeed: {
				start: 0.25,
				end  : 0.75
			},
			initialSize: {
				start: 0.04,
				end  : 0.4
			},
			initialColor: {
				start: Color4.White(),
				end  : Color4.White()
			},
			sizeOverTime: {
				start: 0,
				end  : 1
			},
			initialRotation : Quaternion.fromEulerDegrees(0, 0, startZ),
			rotationOverTime: Quaternion.fromEulerDegrees(0, 0, spinZ),
			texture: {
				src       : sprite,
				filterMode: TextureFilterMode.TFM_POINT,
			},
			billboard      : true,
			simulationSpace: PBParticleSystem_SimulationSpace.PSS_WORLD,
		})
	}




	// MARK: Explosion
	export function TriggerExplosion(
		position   : Vector3,
		maxVelocity: number = 40,
		maxSize    : number = 8
	) {
		const entity = engine.addEntity()
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : true,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 0.35,
			maxParticles        : 300 * getParticleRatio(),
			gravity             : 2,
			blendMode           : PBParticleSystem_BlendMode.PSB_ALPHA,
			shape               : ParticleSystem.Shape.Point({}),
			initialVelocitySpeed: { start: 10, end: maxVelocity },
			initialSize         : { start: 0.5, end: maxSize },
			sizeOverTime        : { start: 1, end: 0 },
			initialColor        : { start: Color4.fromHexString("#ffffff"), end: Color4.fromHexString("#cccccc") },
			//colorOverTime       : { start: Color4.create(1.000, 0.800, 0.500, 1.000), end: Color4.create(0.800, 0.200, 0.000, 0.000) },
			bursts              : { values: [
				{ time: 0, count: 48 * getParticleRatio(), cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/sprites/sprites-explosion.png' },
			spriteSheet         : { tilesX: 6, tilesY: 6, framesPerSecond: 36},
			rotationOverTime    : { x: 0, y: 0, z: 0, w: 1 },
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
			prewarm             : true,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 2,
			maxParticles        : 300 * getParticleRatio(),
			gravity             : 6,

			blendMode           : PBParticleSystem_BlendMode.PSB_ALPHA,
			shape               : ParticleSystem.Shape.Cone({ angle: 30, radius: 0.2 }),
			initialVelocitySpeed: { start: 12.5, end: 25 },
			initialSize         : { start: 0.25, end: 3 },
			sizeOverTime        : { start: 1, end: 0 },
			initialColor        : { start: Color4.fromHexString("#ffffff"), end: Color4.fromHexString("#cccccc") },
			bursts              : { values: [
				{ time: 0, count: 16 * getParticleRatio(), cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/sprites/sprites-dust.png' },
			spriteSheet         : { tilesX: 6, tilesY: 6, framesPerSecond: 36},
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
			prewarm             : true,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 2,
			maxParticles        : 300 * getParticleRatio(),
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
				{ time: 0, count: 32 * getParticleRatio(), cycles: 6, interval: 0.8, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/sprites/sprites-pigeons.png' },
			spriteSheet         : { tilesX: 2, tilesY: 2, framesPerSecond: 10},
		})

		utils.timers.setTimeout(() => {
			ParticleSystem.deleteFrom(entity)
			engine.removeEntity(entity)
		}, 2000)

	}


	// MARK: Feathers
	export function TriggerFeathers(
		position: Vector3
	) {
		const total = 32
		const variations = 4 // total must be divisible by variations

		for (let i = 0; i < (variations); i++) {
			const entity = engine.addEntity()

			Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })
			ParticleSystem.create(entity, {
				active              : true,
				loop                : false,
				rate                : 0,
				lifetime            : 0.5,
				maxParticles        : 300 * getParticleRatio(),
				gravity             : 6,

				blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
				shape               : ParticleSystem.Shape.Cone({ angle: 15, radius: 0.2 }),

				initialVelocitySpeed: { start: 5, end: 12.5 },
				initialSize         : { start: 0.1, end: 0.35 },
				sizeOverTime        : { start: 1, end: 1 },
				rotationOverTime    : { x: 0, y: 0, z: 0, w: 1 },
				initialRotation     : Quaternion.fromEulerDegrees(0, 0, Math.random() * 360),
				bursts              : { values: [
					{ time: 0, count: (total/variations) * getParticleRatio(), cycles: 1, interval: 0.01, probability: 1 },
				] },
				billboard           : true,
				texture             : { src: 'assets/sprites/sprites-feathers.png' },
				
				spriteSheet         : { tilesX: 4, tilesY: 4, framesPerSecond: 32},
			})

			utils.timers.setTimeout(() => {
				ParticleSystem.deleteFrom(entity)
				engine.removeEntity(entity)
			}, 2000)
		}

	}


	// MARK: Fireworks
	export function TriggerFireworks(
		position: Vector3
	) {
		const entity = engine.addEntity()

		// create a random bright
		const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]

		Transform.create(entity, { position: position })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			rate                : 0,
			lifetime            : 0.5,
			maxParticles        : 300 * getParticleRatio(),
			gravity             : 6,

			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Point(),

			initialVelocitySpeed: { start: 5, end: 50 },
			initialSize         : { start: 0.25, end: 2 },
			sizeOverTime        : { start: 1, end: 1 },
			initialColor        : { start: randomColor, end: randomColor},
			bursts              : { values: [
				{ time: 0, count: 32 * getParticleRatio(), cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/sprites/sprites-firework.png' },
			
			spriteSheet         : { tilesX: 4, tilesY: 4, framesPerSecond: 32},
		})

		utils.timers.setTimeout(() => {
			ParticleSystem.deleteFrom(entity)
			engine.removeEntity(entity)
		}, 2000)

	}


	// MARK: Fuel
	export function TriggerPickupFuel(
		position: Vector3
	) {
		const entity = engine.addEntity()
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : true,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 2,
			maxParticles        : 300 * getParticleRatio(),
			gravity             : 6,

			blendMode           : PBParticleSystem_BlendMode.PSB_ALPHA,
			shape               : ParticleSystem.Shape.Cone({ angle: 30, radius: 0.2 }),

			initialVelocitySpeed: { start: 12.5, end: 17.5 },
			initialSize         : { start: 0.25, end: 2 },
			sizeOverTime        : { start: 1, end: 0 },
			initialColor        : { start: Color4.fromHexString("#55dd55"), end: Color4.fromHexString("#ffffff")},
			bursts              : { values: [
				{ time: 0, count: 32 * getParticleRatio(), cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/sprites/sprites-fuel.png' },
			spriteSheet         : { tilesX: 6, tilesY: 6, framesPerSecond: 36},
		})

		utils.timers.setTimeout(() => {
			ParticleSystem.deleteFrom(entity)
			engine.removeEntity(entity)
		}, 2000)

	}


	// MARK: Balloon
	export function TriggerPickupBalloon(
		position: Vector3
	) {
		const entity = engine.addEntity()
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-90, 0, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : true,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 2,
			maxParticles        : 300 * getParticleRatio(),
			gravity             : 6,

			blendMode           : PBParticleSystem_BlendMode.PSB_ALPHA,
			shape               : ParticleSystem.Shape.Cone({ angle: 30, radius: 0.2 }),

			initialVelocitySpeed: { start: 12.5, end: 27.5 },
			initialSize         : { start: 0.25, end: 3 },
			sizeOverTime        : { start: 1, end: 0 },
			initialColor        : { start: Color4.fromHexString("#FFFC00"), end: Color4.fromHexString("#FF7800")},
			bursts              : { values: [
				{ time: 0, count: 24 * getParticleRatio(), cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/sprites/sprites-fabric.png' },
			spriteSheet         : { tilesX: 6, tilesY: 6, framesPerSecond: 36},
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
		const limit: PBParticleSystem_LimitVelocity = { speed: 100 }
		Transform.create(entity, { position: position, rotation: Quaternion.fromEulerDegrees(-45, yRot, 0) })
		ParticleSystem.create(entity, {
			active              : true,
			loop                : false,
			prewarm             : true,
			faceTravelDirection : false,
			rate                : 0,
			lifetime            : 2,
			maxParticles        : 200 * getParticleRatio(),
			gravity             : 2,
			blendMode           : PBParticleSystem_BlendMode.PSB_ALPHA,
			shape               : ParticleSystem.Shape.Cone({ angle: 15, radius: 0.2 }),
			initialVelocitySpeed: { start: 35, end: 75 },
			
			initialSize         : { start: 0.25, end: 0.75 },
			sizeOverTime        : { start: 1, end: 0 },
			//limitVelocity       : { speed: 10, dampen: 0.1},
			//rotationOverTime    : { x: 0, y: 0, z: 0, w: 1 },
			initialColor        : { start: Color4.fromHexString("#aaaaaa"), end: Color4.fromHexString("#ffffff") },
			//colorOverTime       : { start: Color4.create(1.000, 0.800, 0.500, 1.000), end: Color4.create(0.800, 0.200, 0.000, 0.000) },
			bursts              : { values: [
				{ time: 0, count: 64 * getParticleRatio(), cycles: 1, interval: 0.01, probability: 1 },
			] },
			billboard           : true,
			texture             : { src: 'assets/sprites/sprites-speed.png' },
			spriteSheet         : { tilesX: 6, tilesY: 6, framesPerSecond: 36},
		})

		utils.timers.setTimeout(() => {
			ParticleSystem.deleteFrom(entity)
			engine.removeEntity(entity)
		}, 2000)
	}
}