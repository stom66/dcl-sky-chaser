import { isMobile } from '@dcl/sdk/platform'
import ReactEcs from '@dcl/sdk/react-ecs'
import { ButtonImage, Layer, ZoneType } from '@stom66/dcl-ui-component-kit'

import { btnHowToPlayAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { howToPlayLayer } from 'src/client/ui/themes/skyChaser/layers/howToPlay.layer'


// MARK: HowToPlayButtonLayer
/**
 * TopRight launcher for the How To Play panel. Starts hidden while the panel is open.
 * `btn-howToPlay.png` is the 4-row state atlas (default / hover / pressed / blank).
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
				key      = "howToPlay-button"
				id       = "btn_howToPlay"
				atlas    = {btnHowToPlayAtlas}
				uvColumn = {1}
				width    = {128}
				height   = {128}
				uiTransform = {{
					positionType: 'relative',
					position    : { top: 0, right: isMobile() ? 0 : 128 },
				}}
				callback = {() => {
					howToPlayLayer.show()
				}}
			/>,
		]
	}
}

export const howToPlayButtonLayer = new HowToPlayButtonLayer()
