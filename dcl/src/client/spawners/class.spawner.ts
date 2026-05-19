import { engine } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"


import { createRng } from "src/shared/utils/mulberry"
import { C_GameData, ComponentStore } from "src/shared/components/componentStore"



export class Spawner {

	private origin     = Vector3.create(256, 1, 256)
	private maxSpawns  = 256
	private minRadius  = 32
	private maxRadius  = 256
	private minHeight  = 1
	private maxHeight  = 64
	
	private gameStartTime: number = 0
	
	private respawnOnNewGame = true

	private component: any
	
	constructor(
		component: any,
		maxSpawns: number = 256,
		minRadius: number = 32,
		maxRadius: number = 256,
		minHeight: number = 1,
		maxHeight: number = 64,
	) {
		this.component = component
		this.maxSpawns = maxSpawns
		this.minRadius = minRadius
		this.maxRadius = maxRadius
		this.minHeight = minHeight
		this.maxHeight = maxHeight

		ComponentStore.onComponentChange(C_GameData.GameData, (data) => {
			console.log("Spawner: gameStartTime changed", data)
			this.updateGameStartTime(data?.startTime ?? 0)
		})
	}
	
	private rng: () => number = createRng(ComponentStore.getGameStartTime())

	updateGameStartTime(startTime: number) {
		if (startTime === this.gameStartTime || !this.respawnOnNewGame) return
		this.gameStartTime = startTime
		this.removePickups()
		this.spawnPickups()
	}

	spawnPickups() {
		this.rng = createRng(ComponentStore.getGameStartTime())

		for (let i = 0; i < this.maxSpawns; i++) {
			this.spawnRandomPickup()
		}

		if (!this.spawnerSystem) {
			engine.addSystem(this.spawnerSystem)
		}
	}

	spawnRandomPickup() {
		const angle = this.rng() * 2 * Math.PI
		const distance = this.rng() * (this.maxRadius - this.minRadius) + this.minRadius
		const height = this.rng() * (this.maxHeight - this.minHeight) + this.minHeight
		const x = this.origin.x + distance * Math.cos(angle)
		const y = this.origin.y + height
		const z = this.origin.z + distance * Math.sin(angle)
		const pickup = new this.component(Vector3.create(x, y, z), angle)
	}

	removePickups() {
		for (const [entity] of engine.getEntitiesWith(this.component)) {
			engine.removeEntity(entity)
		}
		engine.removeSystem(this.spawnerSystem)
	}

	spawnerSystem(dt: number) {
		var count = 0
		for (const [entity] of engine.getEntitiesWith(this.component)) {
			count++
		}
		if (count < this.maxSpawns) {
			for (let i = count; i < this.maxSpawns; i++) {
				this.spawnRandomPickup()
			}
		}
	}
}