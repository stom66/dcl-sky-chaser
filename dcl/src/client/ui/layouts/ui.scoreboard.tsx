import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui/index'
import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { vhAsPixels, vwAsPixels } from '../utils/sizing'
import { userProfileCache } from 'src/shared/utils/userProfileCache'
import { EasingFunction, UiText } from '@dcl/sdk/ecs'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { tweenValue } from '../utils/tweens'
import { getUVsForIconAtlasRow, AtlasLabelsRowIndex } from '../utils/atlas'


type ScoreboardRow = {
	displayName: string
	score      : number
}

let scoreboard        : Map<string, ScoreboardRow> = new Map()
let scoreboardVersion : number = 0

ComponentStore.onComponentChange(C_GameData.ScoreBoard, (data) => {
	console.log("ui.scoreboard: SCOREBOARD COMPONENT CHANGED")
	const currentVersion = ++scoreboardVersion
	var scores           = data?.scores ?? []
	scores.sort((a, b) => b.score - a.score)
	
	scoreboard.clear()
	for (const s of scores) {
		scoreboard.set(s.userId, {
			displayName: userProfileCache.getDisplayName(s.userId),
			score      : s.score
		})

		void userProfileCache.getUserDisplayName(s.userId).then((displayName) => {
			if (currentVersion !== scoreboardVersion) return

			const row = scoreboard.get(s.userId)
			if (!row) return

			row.displayName = displayName
		})
	}
})


eventBus.on(ClientEvents.GAME_ACTIVE, (data) => { ShowUI() })
eventBus.on(ClientEvents.GAME_END,    (data) => { HideUI() })

function ShowUI() {
	tweenValue(elementPositionTop, POS_LEFT_DEFAULT, 0.4, (v) => elementPositionTop = v), EasingFunction.EF_EASEOUTBACK
}

function HideUI() {
	tweenValue(elementPositionTop, POS_LEFT_HIDDEN, 0.4, (v) => elementPositionTop = v), EasingFunction.EF_EASEOUTBACK
}

const POS_LEFT_DEFAULT    = 0
const POS_LEFT_HIDDEN     = -400

var elementPositionTop: number   = POS_LEFT_HIDDEN
//var elementPositionTop: number   = POS_LEFT_DEFAULT


function getScoreboardRows() {
	const result: ReactEcs.JSX.Element[] = []

	//console.log("SCOREBOARD:", scoreboard)
	
	var rank = 1
	for (const [userId, row] of scoreboard) {
		result.push(
			<UiEntity
				key={`ui_Scoreboard_row_${userId}`}
				uiTransform={{
					width         : '100%',
					flexDirection : 'row',
					justifyContent: 'space-between',
					padding       : { left: 10, right: 10, top: 5, bottom: 5 },
				}}
				uiBackground={{
					color: alpha(darken(theme.colors.info, 0.2), 0.5),
				}}
			>
				<Label
					value     = {rank.toString()}
					textAlign = 'middle-right'
					fontSize  = {22}
					color     = {theme.colors.light}
					uiTransform={{
						width: '10%',
						flexGrow: 0
					}}
				/>
				<Label
					value     = {row.displayName}
					textAlign = 'middle-left'
					fontSize  = {22}
					color     = {theme.colors.light}
					uiTransform={{
						width: '65%',
						flexGrow: 0,
						flexShrink: 0
					}}
				/>
				<Label
					value     = {row.score.toString()}
					textAlign = 'middle-right'
					fontSize  = {22}
					color     = {theme.colors.light}
				/>
			</UiEntity>
		)
		rank++
	}
	return result
}

// MARK: ScoreboardUI
export function ScoreboardUI() {
	return (
		<UiEntity
			key={`ui_Scoreboard_root`}
			uiTransform={{
				width         : '100%',
				height        : '100%',
				flexDirection : 'column',
				justifyContent: 'center',
				alignItems    : 'flex-start',
				padding       : { top: vhAsPixels(23), left: 64, bottom: vhAsPixels(25) },
				positionType  : 'absolute',
				position      : { right: 0, top: 0 },
			}}
			//uiBackground={{
			//	color: theme.colors.warning,
			//}}
		>
			<UiEntity
				key={`ui_Scoreboard_outer`}
				uiTransform={{
					width         : 256,
					height        : 'auto',
					borderRadius  : 32,
					overflow      : 'hidden',
					flexDirection : 'column',
					borderColor   : darken(theme.colors.info, 0.05),
					borderWidth   : 5,
					justifyContent: 'flex-start',
					padding       : { bottom: 10 },
					position      : { left: elementPositionTop, top: -vhAsPixels(23) },
					maxHeight     : vhAsPixels(50),
					positionType  : 'relative',
					
				}}
				uiBackground={{
					color: alpha(theme.colors.info, 0.7),
				}}
			>
				<UiEntity
					key={`ui_Scoreboard_title_rows`}
					uiTransform={{
						width: '100%',
						height: "auto",
						alignContent: 'center',
						justifyContent: 'center',
						padding       : { top: 10, bottom: 4 },
					}}
					uiBackground={{
						color: alpha(theme.colors.info, 0.9),
					}}
				>	
					<UiEntity
						key={`ui_Scoreboard_title`}
						uiTransform={{
							width       : 256,
							height      : 64,
						}}
						uiBackground={{
							texture    : { src: "assets/images/ui/atlas-gui-labels.png" },
							textureMode: 'stretch',
							uvs        : getUVsForIconAtlasRow(AtlasLabelsRowIndex.POINT),
						}}
					/>
				</UiEntity>

				{getScoreboardRows()}
			</UiEntity>
		</UiEntity>
	)
}
