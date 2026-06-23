import ReactEcs, { Button, Label, UiEntity, UiFontType} from '@dcl/sdk/react-ecs'

import { tweenValue } from "../utils/tweens"
import { Color4 } from '@dcl/sdk/math'
import { IS_DEV } from 'src/shared/settings'

const PANEL_HIDDEN  = -1200
const PANEL_VISIBLE = 8
var panelBottom     : number        = IS_DEV ? PANEL_HIDDEN : PANEL_VISIBLE
//var panelBottom     : number        = PANEL_VISIBLE


const isVisible = () => {return panelBottom > PANEL_HIDDEN}

export function ShowJoinGameUI() {
	tweenValue(panelBottom, PANEL_VISIBLE, 0.2, (v) => panelBottom = v)
}

export function HideJoinGameUI() {
	tweenValue(panelBottom, PANEL_HIDDEN, 0.3, (v) => panelBottom = v)
}



export function HowToPlayUI() {

	//if (!isVisible()) return (<UiEntity />)


	return (
		<UiEntity
			key="ui_debug_root"
			uiTransform={{
				width          : '100%',
				height         : '100%',
				flexDirection  : 'column',
				alignItems     : 'center',
				justifyContent : 'center',
				positionType   : 'absolute',
			}}
		>
			<UiEntity
				uiTransform={{
					width: '1200',
					height: '800',
					positionType: 'relative',
					position: { bottom: panelBottom },
				}}
				uiBackground={{ 
					texture: { src: 'assets/images/ui/howToPlay.png' },
					textureMode: 'stretch',
				}}
			>
				<UiEntity
					uiTransform={{
						width: '90',
						height: '90',
						positionType: 'absolute',
						position: { top: '24', right: '24' },
					}}
					onMouseDown={HideJoinGameUI}
					//uiBackground={{ color: Color4.fromHexString('#ffffffaa') }}
				/>
			</UiEntity>
		</UiEntity>
	)
}
