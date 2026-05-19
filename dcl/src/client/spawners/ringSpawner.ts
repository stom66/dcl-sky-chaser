import { Vector3 } from "@dcl/sdk/math"
import { DeathTrigger } from "../gameComponents/deathTrigger"
import { SpeedRing } from "../gameComponents/speedRing"
import { createRng } from "src/shared/utils/mulberry"
import { C_GameData, ComponentStore } from "src/shared/components/componentStore"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"


export namespace RingSpawner {

	var speedRings: SpeedRing[] = []

	const origin     = Vector3.create(256, 1, 256)
	const maxSpawns  = 64
	const minRadius  = 32
	const maxRadius  = 120
	const minHeight  = 18
	const maxHeight  = 160

	const angleSpacing = 1
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
		spawnRings()
	}

	export function onGameEnd() {
		removeRings()
	}

    export function spawnRings() {
		removeRings()

		rng = createRng(ComponentStore.getGameStartTime())

		for (let a = 0; a <= 360; a += angleSpacing) {

			const distance = rng() * (maxRadius - minRadius) + minRadius
			const height   = rng() * (maxHeight - minHeight) + minHeight
			const x        = origin.x + distance * Math.cos(a)
			const y        = origin.y + height
			const z        = origin.z + distance * Math.sin(a)

			const ring = new SpeedRing(Vector3.create(x, y, z), a)
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