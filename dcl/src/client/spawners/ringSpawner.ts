import { Vector3 } from "@dcl/sdk/math"
import { DeathTrigger } from "../gameComponents/deathTrigger"
import { SpeedRing } from "../gameComponents/speedRing"
import { createRng } from "src/shared/utils/mulberry"
import { C_GameData, ComponentStore } from "src/shared/components/componentStore"


ComponentStore.onComponentChange(C_GameData.GameData, (data) => {
	console.log("FuelSpawner: PlayerFuel changed", data)
	RingSpawner.updateGameStartTime(data?.startTime ?? 0)
})

export namespace RingSpawner {

	var speedRings: SpeedRing[] = []

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
	const xSpacing = 2
	var rng: () => number
	var gameStartTime: number = 0

	export function updateGameStartTime(startTime: number) {
		if (startTime === gameStartTime) return
		gameStartTime = startTime
		spawnRings()
	}

    export function spawnRings() {
		removeRings()

		rng = createRng(ComponentStore.getGameStartTime())

		for (let x = bounds.x.min; x < bounds.x.max; x += xSpacing) {
			const y = rng() * (bounds.y.max - bounds.y.min) + bounds.y.min
			const z = rng() * (bounds.z.max - bounds.z.min) + bounds.z.min
			const ring = new SpeedRing(Vector3.create(x, y, z))
			speedRings.push(ring)
		}
    }

	function removeRings() {
		for (const ring of speedRings) {
			ring.Destroy()
		}
		speedRings = []
	}
}