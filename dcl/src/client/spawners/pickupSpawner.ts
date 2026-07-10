import { engine, Entity, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

import { Pickup } from "src/client/gameComponents/pickups/pickup"
import { PickupBalloon } from "src/client/gameComponents/pickups/pickup.balloon"
import { PickupFuel } from "src/client/gameComponents/pickups/pickup.fuel"
import { PickupSpeedRing } from "src/client/gameComponents/pickups/pickup.speedRing"
import { ComponentStore } from "src/shared/components/componentStore"
import { BalloonPickup as BalloonPickupComponent } from "src/shared/components/balloonPickup"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { createRng } from "src/shared/utils/mulberry"
/*
@param {number} defaultSpawnMinRadius - The minimum radius for spawning pickups.

*/
export namespace SpawnManager {

	// CONFIG
	const origin                  = Vector3.create(256, 0, 256)
	const defaultSpawnMinRadius   = 32
	const defaultSpawnMaxRadius   = 100
	const defaultSpawnMinHeight   = 16
	const defaultSpawnMaxHeight   = 48
	const defaultDespawnMaxHeight = 180
	const defaultDespawnMinHeight = 14

	const hiddenLocation = Vector3.create(origin.x, -20, origin.z)

	type PickupType = {
		name              : string, // only used for logging
		spawn             : () => Pickup
		map               : Map<Entity, Pickup>,
		pool              : Pickup[],
		limit             : number
		spawnMinRadius   ?: number,
		spawnMaxRadius   ?: number,
		spawnMinHeight   ?: number,
		spawnMaxHeight   ?: number,
		despawnMaxHeight ?: number,
		despawnMinHeight ?: number,
	}

	const pickupTypes: PickupType[] = [
		{
			name          : "balloon",
			limit         : 128,
			spawn         : () => { return new PickupBalloon(hiddenLocation) },
			map           : new Map(),
			pool          : [],
			spawnMinHeight: 10,
			spawnMaxHeight: 16,
		},
		{
			name          : "fuel",
			limit         : 96,
			spawn         : () => { return new PickupFuel(hiddenLocation) },
			map           : new Map(),
			pool          : [],
			spawnMinHeight: 20,
			spawnMaxHeight: 180,
		},
		{
			name          : "speedRing",
			limit         : 128,
			spawn         : () => { return new PickupSpeedRing(hiddenLocation) },
			map           : new Map(),
			pool          : [],
			spawnMinHeight: 18,
			spawnMaxHeight: 160,
		},
	]

	// STATE
	var rng          : () => number
	var gameStartTime: number = 0
	var isRunning = false


	// MARK: Init
	export function init() {
		console.log("SpawnManager initialized")
		preloadEntities()

		engine.addSystem(sys_UpdatePickups)

		eventBus.on(ClientEvents.GAME_ACTIVE, (data) => {
			if (isRunning) return
			isRunning = true
			onGameStart(data?.startTime ?? ComponentStore.getGameStartTime())
		})
		
		eventBus.on(ClientEvents.GAME_END, () => {
			if (!isRunning) return
			isRunning = false
			onGameEnd()
		})
	}

	// MARK: Preload Entities
	function preloadEntities() {
		console.log("SpawnManager: Preloading entities")
		const startTime = Date.now()
		let count = 0
		for (const entityType of pickupTypes) {
			for (let i = 0; i < entityType.limit; i++) {
				const pickup = entityType.spawn()
				entityType.pool.push(pickup)
				entityType.map.set(pickup.rootEntity, pickup)
				count++
			}
		}
		console.log("SpawnManager: Preloaded entities, took", Date.now() - startTime, "ms to spawn", count, "entities")
	}


	// MARK: On Game Start
	function onGameStart(startTime: number) {
		if (startTime === gameStartTime) return
		gameStartTime = startTime

		rng = createRng(ComponentStore.getGameStartTime())

		activatePickups()
	}


	// MARK: On Game End
	function onGameEnd() {
		deactivatePickups()
	}


	// MARK: Activate Pickups
	function activatePickups() {
		for (const entityType of pickupTypes) {
			const angleSpacing = 360 / entityType.limit
			for (const [index, pickup] of entityType.pool.entries()) {
				let angle = index * angleSpacing
				const randomPosition = getRandomPosition(entityType, angle)
				pickup.Activate(randomPosition)
				console.log("SpawnManager: Activated pickup at", randomPosition.x, randomPosition.y, randomPosition.z)
			}
		}
	}


	// MARK: Get Random Position
	function getRandomPosition(
		entityType: PickupType,
		angle     : number = rng() * 2 * Math.PI
	) {

		const rMin = entityType.spawnMinRadius ?? defaultSpawnMinRadius
		const rMax = entityType.spawnMaxRadius ?? defaultSpawnMaxRadius
		const hMin = entityType.spawnMinHeight ?? defaultSpawnMinHeight
		const hMax = entityType.spawnMaxHeight ?? defaultSpawnMaxHeight

		const distance = rng() * (rMax - rMin) + rMin
		const height   = rng() * (hMax - hMin) + hMin
		const x        = origin.x + distance * Math.cos(angle)
		const y        = origin.y + height
		const z        = origin.z + distance * Math.sin(angle)

		return Vector3.create(x, y, z)
	}


	// MARK: Deactivate Pickups
	function deactivatePickups() {
		for (const entityType of pickupTypes) {
			for (const pickup of entityType.pool) {
				pickup.Deactivate()
			}
		}
	}


	// MARK: sys_UpdatePickups
	function sys_UpdatePickups(dt: number) {
		if (!isRunning) return

		// Count the number of active items
		for (const entityType of pickupTypes) {
			let activePickups = 0
			for (const pickup of entityType.pool) {
				if (pickup.isActive()) {
					pickup.Step(dt)
					activePickups++
				}
			}

			if (activePickups < entityType.limit) {
				console.log("SpawnManager: Spawning pickup for", entityType.name)

				const pickup = getInactivePickup(entityType)
				if (pickup) {	
					const randomPosition = getRandomPosition(entityType)
					pickup.Activate(randomPosition)
				}
			}
			//console.log("SpawnManager: Active pickups for", entityType.name, ":", activePickups)
		}
	}

	function getInactivePickup(
		entityType: PickupType
	) : Pickup | undefined {
		for (const pickup of entityType.pool) {
			if (!pickup.isActive()) {
				return pickup
			}
		}
		return undefined
	}
}
