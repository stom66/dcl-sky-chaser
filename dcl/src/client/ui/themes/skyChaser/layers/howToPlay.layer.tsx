import { Color4 } from '@dcl/sdk/math'
import ReactEcs from '@dcl/sdk/react-ecs'
import { Background, Layer, ZoneType } from '@stom66/dcl-ui-component-kit'

import type { HowToPlayButtonLayer } from 'src/client/ui/themes/skyChaser/layers/howToPlayButton.layer'


// MARK: HowToPlayLayer
/**
 * How To Play panel (Default zone). Starts visible; close / hide reveals the launcher button.
 */
export class HowToPlayLayer extends Layer {
	private buttonLayer: HowToPlayButtonLayer | null = null
	private visibilitySynced = false

	constructor() {
		super({
			id             : 'skyChaser-howToPlay',
			zone           : ZoneType.Default,
			canBeHidden    : true,
			startHidden    : true,
			showCloseButton: true,
			uiTransform    : {
				width         : 1200,
				height        : 800,
				justifyContent: 'center',
				alignItems    : 'center',
			},
		})
	}


	// MARK: setButtonLayer
	/**
	 * Links the TopRight launcher and patches visibility so Zone close
	 * (`visibilityController.toggle`) still syncs the button.
	 */
	setButtonLayer(buttonLayer: HowToPlayButtonLayer) {
		this.buttonLayer = buttonLayer
		this.syncVisibilityWithButton()
	}


	// MARK: syncVisibilityWithButton
	/**
	 * Zone close calls `visibility.toggle()` directly (not `Layer.hide`),
	 * so button show/hide must hook the controller itself.
	 */
	private syncVisibilityWithButton() {
		if (this.visibilitySynced || !this.buttonLayer) return

		const vis          = this.visibility
		const buttonLayer  = this.buttonLayer
		const originalHide = vis.hide.bind(vis)
		const originalShow = vis.show.bind(vis)

		vis.hide = (duration?: number) => {
			originalHide(duration)
			buttonLayer.show(duration)
		}

		vis.show = (duration?: number) => {
			originalShow(duration)
			buttonLayer.hide(duration)
		}

		this.visibilitySynced = true
	}


	// MARK: body
	protected body() {
		return [
			<Background
				key             = "howToPlay-chrome"
				textureSrc      = "assets/images/ui/howToPlay.png"
				backgroundColor = {Color4.White()}
				borderRadius    = {0}
				borderWidth     = {0}
			/>,
		]
	}
}

export const howToPlayLayer = new HowToPlayLayer()
