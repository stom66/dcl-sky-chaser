import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { Color4 } from '@dcl/sdk/math'

import { tweenValue } from 'src/client/ui-old/utils/tweens'
import { vhAsPixels } from '../utils/sizing'

const PANEL_HIDDEN  = vhAsPixels(110) * -1
const PANEL_VISIBLE = 8
//var panelBottom     : number = IS_DEV ? PANEL_VISIBLE : PANEL_HIDDEN
var panelBottom     : number = PANEL_HIDDEN


var displayString = "New ALL TIME high score!"

export function ShowUI(title: string) {
	displayString = "New " + title + " high score!"
	tweenValue(panelBottom, PANEL_VISIBLE, 0.3, (v) => panelBottom = v)
}

export function HideUI() {
	tweenValue(panelBottom, PANEL_HIDDEN, 0.4, (v) => panelBottom = v)
}



export function LeaderboardWinnerUI() {

	return (
		<UiEntity
			key="ui_leaderboard_winner_root"
			uiTransform={{
				width          : '100%',
				height         : '100%',
				flexDirection  : 'column',
				alignItems     : 'center',
				justifyContent : 'center',
				positionType  : 'absolute',
				position      : { right: 0, top: 0 },
			}}
		>
			<UiEntity
				key="ui_leaderboard_winner_panel"
				uiTransform={{
					width: '1200',
					height: '800',
					positionType: 'relative',
					position: { bottom: panelBottom },
				}}
				uiBackground={{ 
					texture: { src: 'assets/images/ui/leaderboardHighScore.png' },
					textureMode: 'stretch',
				}}
			>
				<UiEntity
					key="ui_leaderboard_winner_close"
					uiTransform={{
						width: '80',
						height: '80',
						positionType: 'absolute',
						position: { top: '52', right: '86' },
					}}
					onMouseDown={HideUI}
					//uiBackground={{ color: Color4.fromHexString('#ffffffaa') }}
				/>
				<UiEntity
					key="ui_leaderboard_winner_message"
					uiTransform={{
						width: '100%',
						height: '80',
						positionType: 'absolute',
						position: { top: '45%' },
					}}
					//uiBackground={{ color: Color4.fromHexString('#ffffffaa') }}
					uiText={{ 
						value    : displayString, 
						fontSize : 64, 
						color    : Color4.White(), 
						textAlign: 'middle-center',
						font     : 'sans-serif',
					}}
				/>
			</UiEntity>
		</UiEntity>
	)
}
