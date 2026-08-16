import { AvatarLocomotionSettings, engine, InputAction, inputSystem, Physics } from "@dcl/sdk/ecs"
import { ComponentStore } from "src/shared/components/componentStore"
import { GameSettings } from "src/shared/settings"
import { LocomotionController } from "./locomotionController"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { GameStatus } from "../shared/enums"

export namespace BoosterInput {

	//var isSpacePressed: Boolean = false
	var isEPressed: Boolean = false

	var gameIsActive = false

	var exhausted = false

	const FUEL_MIN_VALUE = 2 // What does their fuel need to recharge to in order to re-enable the booster?


	export function init() {
		engine.addSystem(sys_inputWatcher)

		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			ComponentStore.resetFuelValue()
		})
	}

	function sys_inputWatcher(dt: number) {
		//isSpacePressed = inputSystem.isPressed(InputAction.IA_JUMP)
		isEPressed   = inputSystem.isPressed(InputAction.IA_PRIMARY)

		gameIsActive = ComponentStore.getGameStatus() == GameStatus.ACTIVE

		const fuelLevel = ComponentStore.getFuelValue().value
		if (isEPressed && !ComponentStore.getSpectatorModeEnabled()) {
			if (gameIsActive) {	
				if (fuelLevel > 0 && !exhausted) {
					ComponentStore.decreaseFuelValue(GameSettings.FUEL_DRAIN_RATE * dt)
					LocomotionController.applyBoostForwardUp(64 * dt, -15)
				}
			} else {
				LocomotionController.applyBoostForwardUp(64 * dt, -15)
			}
		}

		// Did they run dry?
		if (ComponentStore.getFuelValue().value <= 0.01) {
			exhausted = true
		}

		// Slowly refill fuel up to max
		if (fuelLevel < ComponentStore.getFuelValue().maxValue) {
			ComponentStore.increaseFuelValue(GameSettings.FUEL_REFUEL_RATE * dt)
		}

		// Did they exhaust, but are now back above the minim threshold?
		if (exhausted && fuelLevel > FUEL_MIN_VALUE) {	
			exhausted = false
		}
	}
}
