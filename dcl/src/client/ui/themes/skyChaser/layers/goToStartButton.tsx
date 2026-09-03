import { isMobile } from '@dcl/sdk/platform'
import ReactEcs from '@dcl/sdk/react-ecs'
import { ButtonImage, Layer, ZoneType } from '@stom66/dcl-ui-component-kit'
import { PlayerMover } from 'src/client/playerMover'

import { btnGoToStartAtlas, btnHowToPlayAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { IS_DEV } from 'src/shared/settings'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


eventBus.on(ClientEvents.LOAD_COMPLETE, () => {
	goToStartButtonLayer.show()
})

// MARK: GoToStartButtonLayer
/**
 * TopRight launcher for the Go To Start panel. Starts hidden while the panel is open.
 * `btn-goToStart.png` is the 4-row state atlas (default / hover / pressed / blank).
 */
export class GoToStartButtonLayer extends Layer {
	constructor() {
		super({
			id         : 'skyChaser-goToStart-button',
			zone       : ZoneType.TopRight,
			canBeHidden: true,
			startHidden: true,
			uiTransform: {
				width         : 128,
				height        : 128,
				justifyContent: 'flex-end',
				alignItems    : 'flex-start',
				margin        : { right: 128 },
			},
		})
	}


	// MARK: body
	protected body() {
		return [
			<ButtonImage
				key      = "goToStart-button"
				id       = "btn_goToStart"
				atlas    = {btnGoToStartAtlas}
				uvColumn = {1}
				width    = {128}
				height   = {128}
				uiTransform = {{
					positionType: 'relative',
					position    : { top: 0, right: 128 },
				}}
				callback = {() => {
					PlayerMover.movePlayerToSpawn()
				}}
			/>,
		]
	}
}

export const goToStartButtonLayer = new GoToStartButtonLayer()
