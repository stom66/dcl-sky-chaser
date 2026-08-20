import { engine, InputAction, TouchScreenControls } from '@dcl/sdk/ecs'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


export namespace TouchscreenControls {
	export function init() {
		
		configureTouchscreenControls(false)

		eventBus.on(ClientEvents.SPECTATE_ENABLED, () => {
			configureTouchscreenControls(true)
		})
		eventBus.on(ClientEvents.SPECTATE_DISABLED, () => {
			configureTouchscreenControls(false)
		})
	}

	function configureTouchscreenControls(show12: boolean) {
		TouchScreenControls.createOrReplace(engine.RootEntity, {
			hideJoystick : false,
			hideCrosshair: false,
			touchInputs  : [
				{ 
					inputAction: InputAction.IA_ACTION_3, 
					hide       : !show12,
				},
				{ 
					inputAction: InputAction.IA_ACTION_4, 
					hide       : !show12,
				},
				{ inputAction: InputAction.IA_ACTION_5, hide: true },
				{ inputAction: InputAction.IA_ACTION_6, hide: true },
				{ inputAction: InputAction.IA_POINTER, hide: true },
				{ 
					inputAction: InputAction.IA_PRIMARY,
					hide: false,
					icon: { tex: { $case: 'texture', texture: { 
						src: show12 ? 'assets/images/ui/tsc-down.png' : 'assets/images/ui/tsc-booster.png' 
					} } },
				},
				{ 
					inputAction: InputAction.IA_SECONDARY,
					hide: false,
					icon: { tex: { $case: 'texture', texture: { 
						src: show12 ? 'assets/images/ui/tsc-up.png' : 'assets/images/ui/tsc-bird-strike.png' 
					} } },
				},
			],
		})
	}
}
