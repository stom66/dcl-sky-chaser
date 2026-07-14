import { AvatarLocomotionSettings, engine, InputAction, inputSystem, Physics } from "@dcl/sdk/ecs"
import { ComponentStore } from "src/shared/components/componentStore"
import { GameSettings } from "src/shared/settings"
import { LocomotionController } from "./locomotionController"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export namespace ComboManager {


	export function init() {
		engine.addSystem(sys_comboWatcher)

		eventBus.on(ClientEvents.PLAYER_COLLIDED_RING, () => {
			console.log("ComboManager: PLAYER_COLLIDED_RING")
			ComponentStore.incrementComboValue()
		})

		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			ComponentStore.resetComboValue()
		})
	}

	function sys_comboWatcher(dt: number) {
		const value = ComponentStore.getComboValue()
		const lastUpdatedTime = ComponentStore.getComboLastUpdatedTime()

		const timeSinceLastUpdated = Date.now() - lastUpdatedTime
		if (timeSinceLastUpdated > GameSettings.COMBO_COOLDOWN_TIME && value > 1) {
			ComponentStore.decrementComboValue()
		}
	}
}