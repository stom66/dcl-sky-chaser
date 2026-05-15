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

	var maxFuelPickups = 64
	const bounds = {
		x: {
			min: 18,
			max: 360
		},
		y: {
			min: 6,
			max: 64
		},
		z: {
			min: 6,
			max: 58
		}
	}
	var rng: () => number
	var gameStartTime: number = 0


	export function updateGameStartTime(startTime: number) {
		if (startTime === gameStartTime) return
		gameStartTime = startTime
		removeFuelPickups()
		spawnFuelPickups()
	}

	export function spawnFuelPickups() {
		rng = createRng(ComponentStore.getGameStartTime())

		for (let i = 0; i < maxFuelPickups; i++) {
			spawnRandomFuelPickup()
		}

		if (!spawnerSystem) {
			engine.addSystem(spawnerSystem)
		}
	}

	function spawnRandomFuelPickup() {
		const x = Math.random() * (bounds.x.max - bounds.x.min) + bounds.x.min
		const y = Math.random() * (bounds.y.max - bounds.y.min) + bounds.y.min
		const z = Math.random() * (bounds.z.max - bounds.z.min) + bounds.z.min
		const value = Math.ceil(Math.random()*3) * 10
		const fuelPickup = new FuelPickup(Vector3.create(x, y, z), value)
	}

	export function removeFuelPickups() {
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
		if (count < maxFuelPickups) {
			for (let i = count; i < maxFuelPickups; i++) {
				spawnRandomFuelPickup()
			}
		}
	}
}