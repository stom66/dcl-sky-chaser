import { engine } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"

import { FuelPickup as FuelPickupComponent } from "src/shared/components/fuelPickup"

import { FuelPickup } from "src/client/gameComponents/fuelPickup"
import { createRng } from "src/shared/utils/mulberry"
import { C_GameData, ComponentStore } from "src/shared/components/componentStore"

ComponentStore.onComponentChange(C_GameData.GameData, (data) => {
	console.log("FuelSpawner: PlayerFuel changed", data)
	FuelSpawner.updateGameStartTime(data?.startTime ?? 0)
})

export namespace FuelSpawner {

	const origin     = Vector3.create(256, 1, 256)
	const maxSpawns  = 128
	const minRadius  = 32
	const maxRadius  = 256
	const minHeight  = 20
	const maxHeight  = 180

	var rng: () => number
	var gameStartTime: number = 0


	export function updateGameStartTime(startTime: number) {
		if (startTime === gameStartTime) return
		gameStartTime = startTime
		removePickups()
		spawnPickups()
	}

	export function spawnPickups() {
		rng = createRng(ComponentStore.getGameStartTime())

		for (let i = 0; i < maxSpawns; i++) {
			spawnRandomPickup()
		}

		if (!spawnerSystem) {
			engine.addSystem(spawnerSystem)
		}
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
		for (const [entity] of engine.getEntitiesWith(FuelPickupComponent)) {
			engine.removeEntity(entity)
		}
		engine.removeSystem(spawnerSystem)
	}

	function spawnerSystem(dt: number) {
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
}