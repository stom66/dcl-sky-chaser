import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui/index'
import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { vwAsPixels } from '../utils/sizing'
import { userProfileCache } from 'src/shared/utils/userProfileCache'
import { UiText } from '@dcl/sdk/ecs'


let scoreboard: Map<string, number> = new Map()

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

function getScoreboardRows() {
	const result: ReactEcs.JSX.Element[] = []

	//console.log("SCOREBOARD:", scoreboard)
	
	for (const [displayName, score] of scoreboard) {
		result.push(
			<UiEntity
				key={`ui_Scoreboard_row_${displayName}`}
				uiTransform={{
					width: '100%',
					flexDirection: 'row',
					justifyContent: 'space-between',
				}}
			>
				<Label
					value={displayName}
					textAlign='middle-left'
				/>
				<Label
					value={score.toString()}
					textAlign='middle-right'
				/>
			</UiEntity>
		)
	}
	return result
}

// MARK: ScoreboardUI
export function ScoreboardUI() {
	return (
		<UiEntity
			key={`ui_Scoreboard_root`}
			uiTransform={{
				width         : '128',
				height        : '100%',
				flexDirection : 'column',
				position      : { right: vwAsPixels(5) + 20 },
				positionType  : 'absolute',
				justifyContent: 'center',
			}}
		>
			<UiEntity
				key={`ui_Scoreboard_outer`}
				uiTransform={{
					width         : "100%",
					height        : 256,
					borderRadius  : 32,
					overflow      : 'hidden',
					flexDirection : 'column',
					borderColor   : darken(theme.colors.success, 0.05),
					borderWidth   : 5,
					justifyContent: 'flex-start',
					padding       : { top: 10, bottom: 10 },
					
				}}
			>
				<UiEntity
					key={`ui_Scoreboard_rows`}
					uiTransform={{
						width: '100%',
						height: "auto"
					}}
					uiText={{
						value: 'Scoreboard',
						textAlign: 'middle-center',
						fontSize: 18
					}}
				/>
				{getScoreboardRows()}
			</UiEntity>
		</UiEntity>
	)
}
