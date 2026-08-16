import { engine, InputAction, InputModifier, pointerEventsSystem } from "@dcl/sdk/ecs"

import { ComponentStore } from "src/shared/components/componentStore"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

import { SM_Camera } from "./camera"
import { CONFIG } from "./config"
import { SM_PlayerInputs } from "./playerInputs"


export namespace SpectateMode {


	// MARK: init
	/**
	 * Binds pointer events on entities tagged in config.
	 */
	export function init() {
		if (CONFIG.DEBUG_LOGGING) console.log("SpectateMode: init")

		setupTaggedEntitiesPointerSystems()
	}


	// MARK: isEnabled
	/**
	 * Returns whether spectate mode is currently active.
	 */
	export function isEnabled() {
		return ComponentStore.getSpectatorModeEnabled()
	}


	// MARK: toggleSpectateMode
	/**
	 * Enters or exits spectate mode.
	 */
	export function toggleSpectateMode() {
		if (isEnabled()) {
			disableSpectateMode()
		} else {
			enableSpectateMode()
		}
	}


	// MARK: setupTaggedEntitiesPointerSystems
	function setupTaggedEntitiesPointerSystems() {
		const entities = engine.getEntitiesByTag(CONFIG.CREATOR_HUB_MODEL_TAG)

		for (const entity of entities) {
			pointerEventsSystem.onPointerDown({
				entity: entity,
				opts  : {
					button     : InputAction.IA_POINTER,
					hoverText  : CONFIG.INTERACTION_HOVER_TEXT,
					maxDistance: CONFIG.MAX_INTERACTION_DISTANCE
				}
			}, () => {
				if (CONFIG.DEBUG_LOGGING) console.log("SpectateMode: pointerEventsSystem: clicked")
				toggleSpectateMode()
			})
		}
	}


	// MARK: enableSpectateMode
	function enableSpectateMode() {
		if (isEnabled()) return

		if (CONFIG.DEBUG_LOGGING) console.log("SpectateMode: enableSpectateMode")
		ComponentStore.setSpectatorModeEnabled(true)

		SM_Camera.activateCamera()
		SM_PlayerInputs.activate()
		eventBus.emit(ClientEvents.SPECTATE_ENABLED, {})

		InputModifier.createOrReplace(engine.PlayerEntity, {
			mode: {
				$case   : "standard",
				standard: {
					disableAll: true,
				},
			},
		})
	}


	// MARK: disableSpectateMode
	function disableSpectateMode() {
		if (!isEnabled()) return

		if (CONFIG.DEBUG_LOGGING) console.log("SpectateMode: disableSpectateMode")
		ComponentStore.setSpectatorModeEnabled(false)

		SM_Camera.deactivateCamera()
		SM_PlayerInputs.deactivate()
		eventBus.emit(ClientEvents.SPECTATE_DISABLED, {})

		InputModifier.createOrReplace(engine.PlayerEntity, {
			mode: {
				$case   : "standard",
				standard: {
					disableAll: false,
				},
			},
		})
	}

}
