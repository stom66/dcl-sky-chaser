import { Color4 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs from '@dcl/sdk/react-ecs'
import {
	atlasBtn1x1,
	Background,
	ButtonImage,
	Layer,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { howToPlayLayer } from 'src/client/ui/themes/skyChaser/layers/howToPlay.layer'


// MARK: HowToPlayButtonLayer
/**
 * TopRight launcher for the How To Play panel. Starts hidden while the panel is open.
 *
 * `ButtonImage` always samples a 4-row state atlas, so the full art is nested as a
 * child on the blank `atlasBtn1x1` chrome rather than passed as a 1-row `textureSrc`.
 */
export class HowToPlayButtonLayer extends Layer {
	constructor() {
		super({
			id         : 'skyChaser-howToPlay-button',
			zone       : ZoneType.TopRight,
			canBeHidden: true,
			startHidden: true,
			uiTransform: {
				width         : 128,
				height        : 128,
				justifyContent: 'flex-end',
				alignItems    : 'flex-start',
			},
		})
	}


	// MARK: body
	protected body() {
		return [
			<ButtonImage
				key        = "howToPlay-button"
				id         = "btn_howToPlay"
				atlas      = {atlasBtn1x1}
				uvColumn   = {1}
				width      = {128}
				height     = {128}
				uiTransform = {{
					positionType: 'relative',
					position    : { top: 0, right: isMobile() ? 0 : 128 },
				}}
				callback = {() => {
					howToPlayLayer.show()
				}}
			>
				<Background
					key             = "howToPlay-button-art"
					textureSrc      = "assets/images/ui/btn-howToPlay.png"
					backgroundColor = {Color4.White()}
					borderWidth     = {0}
					borderRadius    = {0}
				/>
			</ButtonImage>,
		]
	}
}

export const howToPlayButtonLayer = new HowToPlayButtonLayer()
