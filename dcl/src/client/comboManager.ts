import { AvatarLocomotionSettings, engine, InputAction, inputSystem, Physics } from "@dcl/sdk/ecs"
import { ComponentStore } from "src/shared/components/componentStore"
import { GameSettings } from "src/shared/settings"
import { LocomotionController } from "./locomotionController"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export namespace ComboManager {


	export function init() {
		engine.addSystem(systemComboWatcher)

		eventBus.on(ClientEvents.TRIGGER_RING, () => {
			console.log("ComboManager: TRIGGER_RING")
			ComponentStore.incrementComboValue()
		})
	}

	function systemComboWatcher(dt: number) {
		const value = ComponentStore.getComboValue()
		const lastUpdatedTime = ComponentStore.getComboLastUpdatedTime()

		const timeSinceLastUpdated = Date.now() - lastUpdatedTime
		if (timeSinceLastUpdated > GameSettings.COMBO_COOLDOWN_TIME && value > 1) {
			ComponentStore.decrementComboValue()
		}
	}
}