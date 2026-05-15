import { Vector3 } from "@dcl/sdk/math"
import { DeathTrigger } from "../gameComponents/deathTrigger"

export namespace TriggerSpawner {

	var deathTriggers: DeathTrigger[] = []

    export function spawnTriggers() {
        const floorDeathTrigger = new DeathTrigger(Vector3.create(192, 1, 32), Vector3.create(384, 2, 64))
		deathTriggers.push(floorDeathTrigger)
    }
}