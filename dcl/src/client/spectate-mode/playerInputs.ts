import { engine, InputAction, inputSystem, PointerEventType } from "@dcl/sdk/ecs"

import { SM_Camera } from "./camera"
import { SM_PlayerRoster } from "./playerRoster"


export namespace SM_PlayerInputs {


	// MARK: init
	/**
	 * Starts watching spectate camera inputs.
	 */
	export function init() {
		engine.addSystem(sys_WatchPlayerInput)
	}


	// MARK: activate
	/**
	 * Starts watching spectate camera inputs.
	 */
	export function activate() {
		engine.addSystem(sys_WatchPlayerInput)
	}


	// MARK: deactivate
	/**
	 * Stops watching spectate camera inputs.
	 */
	export function deactivate() {
		engine.removeSystem(sys_WatchPlayerInput)
	}


	// MARK: sys_WatchPlayerInput
	function sys_WatchPlayerInput(dt: number) {
		if (inputSystem.isPressed(InputAction.IA_FORWARD))  SM_Camera.Pitch(-dt)
		if (inputSystem.isPressed(InputAction.IA_BACKWARD)) SM_Camera.Pitch(dt)

		if (inputSystem.isPressed(InputAction.IA_LEFT))  SM_Camera.Yaw(-dt)
		if (inputSystem.isPressed(InputAction.IA_RIGHT)) SM_Camera.Yaw(dt)

		if (inputSystem.isPressed(InputAction.IA_PRIMARY)) {
			SM_PlayerRoster.getCurrentPlayerUserId() ? SM_Camera.Zoom(-dt) : SM_Camera.Raise(dt)
		}
		if (inputSystem.isPressed(InputAction.IA_SECONDARY)) {
			SM_PlayerRoster.getCurrentPlayerUserId() ? SM_Camera.Zoom(dt) : SM_Camera.Lower(dt)
		}

		if (inputSystem.isTriggered(InputAction.IA_ACTION_3, PointerEventType.PET_DOWN)) SM_Camera.CycleTarget(1)
		if (inputSystem.isTriggered(InputAction.IA_ACTION_4, PointerEventType.PET_DOWN)) SM_Camera.CycleTarget(-1)
	}

}
