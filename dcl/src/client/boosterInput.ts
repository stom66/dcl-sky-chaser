import { AvatarLocomotionSettings, engine, InputAction, inputSystem, Physics } from "@dcl/sdk/ecs"
import { ComponentStore } from "src/shared/components/componentStore"
import { GameSettings } from "src/shared/settings"
import { LocomotionController } from "./locomotionController"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export namespace BoosterInput {

	var isSpacePressed: Boolean = false
	var isEPressed: Boolean = false

	var gameIsActive = true


	export function init() {
		engine.addSystem(systemInputWatcher)

		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			ComponentStore.resetFuelValue()
		})
	}

	function systemInputWatcher(dt: number) {
		isSpacePressed = inputSystem.isPressed(InputAction.IA_JUMP)
		isEPressed     = inputSystem.isPressed(InputAction.IA_PRIMARY)

		const fuelLevel = ComponentStore.getFuelValue().value
		if (isEPressed && gameIsActive && fuelLevel > 0) {
			ComponentStore.decreaseFuelValue(GameSettings.FUEL_DRAIN_RATE * dt)
			LocomotionController.applyBoostForwardUp(64 * dt, -15)
		}

		// Slowly refill fuel up to max
		if (fuelLevel < ComponentStore.getFuelValue().maxValue) {
			ComponentStore.increaseFuelValue(GameSettings.FUEL_REFUEL_RATE * dt)
		}
	}
}