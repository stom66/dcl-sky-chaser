import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { BounceTriggerUmbrella } from "../gameComponents/subClasses/bounceTrigger.umbrella"
import { BounceTriggerTrampoline } from "../gameComponents/subClasses/bounceTrigger.trampoline"
import { BounceTriggerAwning } from "../gameComponents/subClasses/bounceTrigger.awning"

export namespace BounceSpawner {

	export function init() {
		console.log("BounceSpawner: init")

		// Umbrellas
		const umbrella_top    = new BounceTriggerUmbrella(Vector3.create(251.58, 66.50, 270.46), 100)
		const umbrella_hotTub = new BounceTriggerUmbrella(Vector3.create(280.70, 43.21, 259.90), 160)

		// Trampolines
		const trampoline_1 = new BounceTriggerTrampoline(Vector3.create(263, 64, 247), -135, 120)
		const trampoline_2 = new BounceTriggerTrampoline(Vector3.create(245, 64, 256.5), -105,  120)

		// Awning
		const position = Vector3.create(258.163, 56.5, 278.01)
		const rotation = Quaternion.fromEulerDegrees(-24, 180, 0)
		const scale    = Vector3.create(8.6, 5, 6.9)
		const awning   = new BounceTriggerAwning(position, rotation, scale, 120)
	}
}