import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { BounceTriggerUmbrella } from "../gameComponents/bounceTriggers/bounceTrigger.umbrella"
import { BounceTriggerTrampoline } from "../gameComponents/bounceTriggers/bounceTrigger.trampoline"
import { BounceTriggerAwning } from "../gameComponents/bounceTriggers/bounceTrigger.awning"
import { engine } from "@dcl/sdk/ecs"

export namespace BounceSpawner {

	export function init() {
		console.log("BounceSpawner: init")

		// Umbrellas
		const umbrella_top       = new BounceTriggerUmbrella(Vector3.create(251.58, 66.50, 270.46), 100)
		const umbrella_hotTub    = new BounceTriggerUmbrella(Vector3.create(280.70, 43.21, 259.90), 160)
		const umbrella_cliffSide = new BounceTriggerUmbrella(Vector3.create(168.05, 121.1, 219.10), 160)

		// Trampolines
		for (const entity of engine.getEntitiesByTag("trampoline")) {
			new BounceTriggerTrampoline(entity, 120)
		}

		// Awning, upper
		const position = Vector3.create(258.163, 56.5, 278.01)
		const rotation = Quaternion.fromEulerDegrees(-24, 180, 0)
		const scale    = Vector3.create(8.6, 5, 6.9)
		const awning   = new BounceTriggerAwning(position, rotation, scale, 120)

		// Awning, upper
		const position2 = Vector3.create(245.287, 39.7211, 256.0)
		const rotation2 = Quaternion.fromEulerDegrees(-24, 270, 0)
		const scale2    = Vector3.create(8.6, 5, 6.9)
		const awning2   = new BounceTriggerAwning(position2, rotation2, scale2, 120, -90)
	}
}