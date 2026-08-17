import { Vector3 } from "@dcl/sdk/math"
import { DeathTrigger } from "../gameComponents/deathTrigger"

export namespace TriggerSpawner {

	var deathTriggers: DeathTrigger[] = []

    export function spawnTriggers() {
        const floorDeathTrigger = new DeathTrigger(Vector3.create(256, 11, 256), Vector3.create(512, 22, 512))
		deathTriggers.push(floorDeathTrigger)
    }
}