import { engine, Entity, Transform } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"

import { BalloonPickup as BalloonPickupComponent } from "src/shared/components/balloonPickup"

import { FuelPickup } from "src/client/gameComponents/fuelPickup"
import { BalloonPickup } from "src/client/gameComponents/balloonPickup"

import { createRng } from "src/shared/utils/mulberry"
import { C_GameData, ComponentStore } from "src/shared/components/componentStore"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"


export namespace BalloonSpawner {

	const ballonInstances: Map<Entity, BalloonPickup> = new Map()

	const origin     = Vector3.create(256, 1, 256)
	const maxSpawns  = 128
	const minRadius  = 32
	const maxRadius  = 120
	const minHeight  = 16
	const maxHeight  = 48
	const despawnHeight = 180


	var rng: () => number
	var gameStartTime: number = 0

	var systemsAdded = false


	export function init() {
		eventBus.on(ClientEvents.GAME_ACTIVE, (data) => {
			onGameStart(data?.startTime ?? 0)
		})
		
		eventBus.on(ClientEvents.GAME_END, () => {
			onGameEnd()
		})
	}

	export function onGameStart(startTime: number) {
		if (startTime === gameStartTime) return
		gameStartTime = startTime
		removePickups()
		spawnPickups()
	}

	export function onGameEnd() {
		removePickups()
	}

	export function spawnPickups() {
		rng = createRng(ComponentStore.getGameStartTime())

		for (let i = 0; i < maxSpawns; i++) {
			const balloonInstance = spawnRandomPickup()
			ballonInstances.set(balloonInstance.entity, balloonInstance)
		}

		if (!systemsAdded) {
			systemsAdded = true
			engine.addSystem(spawnerSystem)
			engine.addSystem(moverSystem)
		}
	}

	function spawnRandomPickup() {
		const angle    = rng() * 2 * Math.PI
		const distance = rng() * (maxRadius - minRadius) + minRadius
		const height   = rng() * (maxHeight - minHeight) + minHeight
		const x        = origin.x + distance * Math.cos(angle)
		const y        = origin.y + height
		const z        = origin.z + distance * Math.sin(angle)
		const value    = Math.ceil(Math.random()*3) * 10
		const pickup   = new BalloonPickup(Vector3.create(x, y, z))

		return pickup
	}

	export function removePickups() {
		for (const [entity] of ballonInstances.entries()) {
			removePickup(entity)
		}
		engine.removeSystem(spawnerSystem)
	}

	function removePickup(entity: Entity) {
		const balloonInstance = ballonInstances.get(entity)
		if (balloonInstance) {
			balloonInstance.Destroy()
			ballonInstances.delete(entity)
		}
	}


	function spawnerSystem(dt: number) {
		var count = [...engine.getEntitiesWith(BalloonPickupComponent)].length

		if (count < maxSpawns) {
			for (let i = count; i < maxSpawns; i++) {
				//console.log("BalloonSpawner: spawning replacement pickup", i)
				const balloonInstance = spawnRandomPickup()
				ballonInstances.set(balloonInstance.entity, balloonInstance)
			}
		}
	}

	function moverSystem(dt: number) {
		for (const [entity] of engine.getEntitiesWith(BalloonPickupComponent)) {
			const riseSpeed = BalloonPickupComponent.get(entity)?.riseSpeed ?? 0
			const transform = Transform.getMutable(entity)
			transform.position.y += dt * riseSpeed
			if (transform.position.y > despawnHeight) {
				removePickup(entity)
			}
		}
	}
}