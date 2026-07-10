import ReactEcs, { Button, Label, UiEntity, UiFontType} from '@dcl/sdk/react-ecs'

import { tweenValue } from "../utils/tweens"
import { IS_DEV } from 'src/shared/settings'
import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { userProfileCache } from 'src/shared/utils/userProfileCache'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { theme } from '../vars/theme'
import { alpha, darken } from '../utils/colors'
import { ButtonImageClose } from '../components/buttonImage.close'


// MARK: Vars
let scoreboard      : Map<string, number> = new Map()

const PANEL_HIDDEN  = -1200
const PANEL_VISIBLE = 8
var panelBottom     : number = PANEL_HIDDEN
//var panelBottom     : number = IS_DEV ? PANEL_HIDDEN: PANEL_VISIBLE


// MARK: Events
ComponentStore.onComponentChange(C_GameData.ScoreBoard, (data) => {
 	console.log("ui.scoreboard: SCOREBOARD COMPONENT CHANGED")
	var scores = data?.scores ?? []
	scores.sort((a, b) => b.score - a.score)
	
	scoreboard.clear()
	for (const s of scores) {
		void userProfileCache.getUserProfile(s.userId)
		scoreboard.set(userProfileCache.getDisplayName(s.userId), s.score)
	}
})

eventBus.on(ClientEvents.GAME_END, (data) => { ShowUI() })
eventBus.on(ClientEvents.GAME_ACTIVE, (data) => { HideUI() })



// MARK: Utiltiies
export function ShowUI() {
	tweenValue(panelBottom, PANEL_VISIBLE, 0.5, (v) => panelBottom = v)
}

export function HideUI() {
	tweenValue(panelBottom, PANEL_HIDDEN, 0.5, (v) => panelBottom = v)
}



// MARK: UI - getRows
function getScoreboardRows() {
	const result: ReactEcs.JSX.Element[] = []

	let i = 0
	for (const [displayName, score] of scoreboard) {
		i++
		result.push(
			<UiEntity
				key         = {`ui_Results_row_${displayName}`}
				uiTransform = {{
					height        : 'auto',
					width         : '100%',
					flexDirection : 'row',
					justifyContent: 'space-between',
					padding       : { left  : 10, right: 10 },
					margin        : { bottom: 10 - (i*0.5) },
					borderRadius  : 12,
				}}
				uiBackground = {{
					color: alpha(darken(theme.colors.primary, 0.2), i % 2 == 0 ? 0.1 : 0),
				}}
			>
				<Label
					value       = {i.toString()}
					textAlign   = 'middle-left'
					fontSize    = {22-(i*0.75)}
					color       = {theme.colors.light}
					uiTransform = {{
						width : '18%',
						height: 'auto',
					}}
				/>
				<Label
					value       = {displayName}
					textAlign   = 'middle-left'
					fontSize    = {22-(i*0.5)}
					color       = {theme.colors.light}
					uiTransform = {{
						width : '65%',
						height: 'auto',
					}}
				/>
				<Label
					value       = {score.toString()}
					textAlign   = 'middle-right'
					fontSize    = {22-(i*0.75)}
					color       = {theme.colors.light}
					uiTransform = {{
						width         : '17%',
						height        : 'auto',
						justifyContent: 'flex-end',
					}}
				/>
			</UiEntity>
		)
	}
	return result
}


// MARK: UI - Main
export function ResultsUI() {

	//if (!isVisible()) return (<UiEntity />)


	return (
		<UiEntity
			key         = "ui_results_root"
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
				key         = "ui_results_panel"
				uiTransform = {{
					width       : '1200',
					height      : '800',
					positionType: 'relative',
					position    : { bottom: panelBottom },
				}}
				uiBackground={{ 
					texture    : { src: 'assets/images/ui/results.png' },
					textureMode: 'stretch',
				}}
			>

				<ButtonImageClose
					id          = "ui_results_close"
					callback    = {HideUI}
					uiTransform = {{
						position    : { top: '24', right: '24' },
					}}
				 />
				<UiEntity
					key         = "ui_results_scoreboard_rows"
					uiTransform = {{
						width         : '690',
						height        : '400',
						positionType  : 'absolute',
						position      : { bottom: '48', right: '95' },
						flexDirection : 'column',
						justifyContent: 'flex-start',
						alignItems    : 'center',
					}}
				>
					{getScoreboardRows()}
				</UiEntity>
			</UiEntity>
		</UiEntity>
	)
}
