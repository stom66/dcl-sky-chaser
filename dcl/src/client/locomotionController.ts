import { AvatarLocomotionSettings, engine, PBAvatarLocomotionSettings, Physics, Transform } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
import { GameSettings } from "src/shared/settings";
import { ClientEvents, eventBus } from "src/shared/utils/eventBus";

export namespace LocomotionController {

	const defaultSettings: PBAvatarLocomotionSettings = {
		runSpeed    : 10,
		jumpHeight  : 2,
		glidingSpeed: 6
	}

	export function init() {
		applyLocomotionSettings()

		eventBus.on(ClientEvents.PLAYER_COMBO_INCREASE, (data: { value: number }) => {
			console.log("ComboManager: COMBO_INCREASE")	
			setGlidingSpeed(defaultSettings.glidingSpeed! + (data.value * GameSettings.COMBO_GLIDING_SPEED_INCREMENT))
		})

		eventBus.on(ClientEvents.PLAYER_COMBO_DECREASE, (data: { value: number }) => {
			console.log("ComboManager: COMBO_INCREASE")	
			setGlidingSpeed(defaultSettings.glidingSpeed! + (data.value * GameSettings.COMBO_GLIDING_SPEED_INCREMENT))
		})
	}

	function applyLocomotionSettings(settings = defaultSettings) {
		AvatarLocomotionSettings.createOrReplace(engine.PlayerEntity, {
			...settings,
		})
		console.log("LocomotionController: applyLocomotionSettings: glidingSpeed", settings.glidingSpeed)
	}

	export function setGlidingSpeed(speed: number) {
		const newSettings = { ...defaultSettings, glidingSpeed: speed }
		applyLocomotionSettings(newSettings)
	}

	export function applyBoostForwardUp(boost: number, tiltUp: number = -45) {
		const t    = Transform.getOrNull(engine.PlayerEntity)
		if (!t) return
		
		const tilt = Vector3.rotate(Vector3.Forward(), Quaternion.fromEulerDegrees(tiltUp, 0, 0))
		const dir  = Vector3.rotate(tilt, t.rotation)
		
		Physics.applyImpulseToPlayer(dir, boost)
	}
}
