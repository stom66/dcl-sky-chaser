import { Vector3 } from "@dcl/sdk/math"
import { movePlayerTo } from "~system/RestrictedActions"

export namespace PlayerMover {

	const spawnPosition = Vector3.create(2, 17, 32)

    export function movePlayerToSpawn() {
		movePlayerTo({ newRelativePosition: spawnPosition })
    }
}
