import ReactEcs, { Button, Label, UiEntity, UiFontType} from '@dcl/sdk/react-ecs'

import { tweenValue } from "../utils/tweens"
import { Color4 } from '@dcl/sdk/math'
import { IS_DEV } from 'src/shared/settings'
import { vhAsPixels } from '../utils/sizing'

const PANEL_HIDDEN  = -1200
const PANEL_VISIBLE = 8
//var panelBottom     : number        = IS_DEV ? PANEL_HIDDEN : PANEL_VISIBLE
var panelBottom     : number        = PANEL_VISIBLE

export function ShowUI() {
	tweenValue(panelBottom, PANEL_VISIBLE, 0.5, (v) => panelBottom = v)
}

export function HideUI() {
	tweenValue(panelBottom, PANEL_HIDDEN, 0.5, (v) => panelBottom = v)
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
					width: '128',
					height: '128',
					positionType: 'absolute',
					position: { top: vhAsPixels(50)-400, right: '24' },
				}}
				onMouseDown={ShowUI}
				uiBackground={{ 
					texture: { src: 'assets/images/ui/btn-howToPlay.png' },
					textureMode: 'stretch',
				}}
			/>

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
					onMouseDown={HideUI}
					//uiBackground={{ color: Color4.fromHexString('#ffffffaa') }}
				/>
			</UiEntity>
		</UiEntity>
	)
}
