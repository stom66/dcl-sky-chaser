import { Vector3 } from "@dcl/sdk/math"
import { movePlayerTo } from "~system/RestrictedActions"

export namespace PlayerMover {

	/** Scene-relative top spawn (teleport + debug firework origin). */
	export const spawnPosition = Vector3.create(256, 66, 256)


	// MARK: movePlayerToSpawn
	/** Teleports the local player to {@link spawnPosition}. */
	export function movePlayerToSpawn() {
		movePlayerTo({ newRelativePosition: spawnPosition })
	}
}
