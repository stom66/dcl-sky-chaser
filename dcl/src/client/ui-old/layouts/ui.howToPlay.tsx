import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { vhAsPixels } from 'src/client/ui-old/utils/sizing'
import { tweenValue } from 'src/client/ui-old/utils/tweens'
import { ButtonImageClose } from '../components'

const PANEL_HIDDEN  = vhAsPixels(110) * -1
const PANEL_VISIBLE = 8
var panelBottom     : number = PANEL_VISIBLE

const BUTTON_HIDDEN = -256
const BUTTON_VISIBLE = 8
var buttonTop       : number = PANEL_HIDDEN / 8


// MARK: ShowUI
/** Shows the How To Play panel. */
export function ShowUI() {
	tweenValue(panelBottom, PANEL_VISIBLE, 0.5, (v) => panelBottom = v)
	tweenValue(buttonTop, BUTTON_HIDDEN, 0.5, (v) => buttonTop = v)
}


// MARK: HideUI
/** Hides the How To Play panel. */
export function HideUI() {
	tweenValue(panelBottom, PANEL_HIDDEN, 0.5, (v) => panelBottom = v)
	tweenValue(buttonTop, BUTTON_VISIBLE, 0.5, (v) => buttonTop = v)
}


// MARK: HowToPlayUI
/** Renders the How To Play panel and its launcher button. */
export function HowToPlayUI() {
	return (
		<UiEntity
			key         = "ui_how_to_play_root"
			uiTransform = {{
				width         : '100%',
				height        : '100%',
				flexDirection : 'column',
				alignItems    : 'center',
				justifyContent: 'center',
				positionType  : 'absolute',
				position      : { right:  0, top: 0 },
			}}
		>
			<UiEntity
				key         = "ui_how_to_play_button"
				uiTransform = {{
					width       : '128',
					height      : '128',
					positionType: 'absolute',
					position    : { top: buttonTop, right: 160 + 256 + 10 }, // Next to where the scoreboard comes in
					zIndex      : 9999,
				}}
				onMouseDown  = {ShowUI}
				uiBackground = {{ 
					texture    : { src: 'assets/images/ui/btn-howToPlay.png' },
					textureMode: 'stretch',
				}}
			/>

			<UiEntity
				key         = "ui_how_to_play_panel"
				uiTransform = {{
					width       : '1200',
					height      : '800',
					positionType: 'relative',
					position    : { bottom: panelBottom },
				}}
				uiBackground={{
					texture    : { src: 'assets/images/ui/howToPlay.png' },
					textureMode: 'stretch',
				}}
			>
				<ButtonImageClose
					id          = "ui_how_to_play_close"
					callback    = {HideUI}
					uiTransform = {{
						position    : { top: '24', right: '24' },
					}}
				 />
			</UiEntity>
		</UiEntity>
	)
}
