import { engine, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

import { FuelPickupComponent, FuelPickupChildComponent } from "src/shared/components/fuelPickup"

import { FuelPickup } from "src/client/gameComponents/fuelPickup"
import { createRng } from "src/shared/utils/mulberry"
import { C_GameData, ComponentStore } from "src/shared/components/componentStore"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"


export namespace FuelSpawner {

	const origin     = Vector3.create(256, 1, 256)
	const maxSpawns  = 128
	const minRadius  = 32
	const maxRadius  = 120
	const minHeight  = 20
	const maxHeight  = 180

	const spinSpeed = 360

	var rng: () => number
	var gameStartTime: number = 0


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
		//removePickups()
		spawnPickups()
	}

	export function onGameEnd() {
		removePickups()
	}

	export function spawnPickups() {
		rng = createRng(ComponentStore.getGameStartTime())

		for (let i = 0; i < maxSpawns; i++) {
			spawnRandomPickup()
		}

		engine.addSystem(system_Spawner)
		engine.addSystem(system_Mover)
	}

	function spawnRandomPickup() {
		const angle    = rng() * 2 * Math.PI
		const distance = rng() * (maxRadius - minRadius) + minRadius
		const height   = rng() * (maxHeight - minHeight) + minHeight
		const x        = origin.x + distance * Math.cos(angle)
		const y        = origin.y + height
		const z        = origin.z + distance * Math.sin(angle)
		const value = Math.ceil(Math.random()*3) * 10
		const pickup   = new FuelPickup(Vector3.create(x, y, z), value)
	}

	export function removePickups() {
		engine.removeSystem(system_Mover)
		engine.removeSystem(system_Spawner)

		for (const [entity] of engine.getEntitiesWith(FuelPickupComponent)) {
			engine.removeEntity(entity)
		}
		engine.removeSystem(system_Spawner)
	}

	function system_Spawner(dt: number) {
		var count = 0
		for (const [entity] of engine.getEntitiesWith(FuelPickupComponent)) {
			count++
		}
		if (count < maxSpawns) {
			for (let i = count; i < maxSpawns; i++) {
				spawnRandomPickup()
			}
		}
	}

	function system_Mover(dt: number) {
		for (const [entity] of engine.getEntitiesWith(FuelPickupChildComponent)) {
			const transform = Transform.getMutableOrNull(entity)
			if (!transform) continue

			const currentRotation = Quaternion.toEulerAngles(transform.rotation)
			transform.rotation = Quaternion.fromEulerDegrees(
				currentRotation.x,
				currentRotation.y + dt * spinSpeed,
				currentRotation.z
			)
		}
	}
}