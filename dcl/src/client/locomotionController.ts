import { AvatarLocomotionSettings, engine, Physics, Transform } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";

export namespace LocomotionController {

	export function init() {
		applyLocomotionSettings()
	}

	function applyLocomotionSettings() {
		AvatarLocomotionSettings.create(engine.PlayerEntity, {
			runSpeed: 10,
			jumpHeight: 2,
			//glideSpeed: 10,
		})
	}

	export function applyBoostForwardUp(boost: number, tiltUp: number = -45) {
		const t    = Transform.getOrNull(engine.PlayerEntity)
		if (!t) return
		
		const tilt = Vector3.rotate(Vector3.Forward(), Quaternion.fromEulerDegrees(tiltUp, 0, 0))
		const dir  = Vector3.rotate(tilt, t.rotation)
		
		Physics.applyImpulseToPlayer(dir, boost)
	}
}
