import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui/index'
import { C_GameData, C_PlayerFuel, ComponentStore } from 'src/shared/components/componentStore'
import { vwAsPixels } from '../utils/sizing'
import { userProfileCache } from 'src/shared/utils/userProfileCache'

let fuelValue    = 100
let maxFuelValue = 100
let ratio        = fuelValue / maxFuelValue
let scoreboard   = [] as { userId: string, score: number }[]

ComponentStore.onComponentChange(C_PlayerFuel.PlayerFuel, (data) => {
	fuelValue    = data?.value ?? 0
	maxFuelValue = data?.maxValue ?? 100
	ratio        = Math.ceil((fuelValue / maxFuelValue) * 100)
})

ComponentStore.onComponentChange(C_GameData.ScoreBoard, (data) => {
	scoreboard = data?.scores ?? []
	
	for (const s of scoreboard) {
		void userProfileCache.getUserProfile(s.userId)
	}
	
	scoreboard.sort((a, b) => b.score - a.score)
})

function getScoreboardRows() {
	const result: ReactEcs.JSX.Element[] = []

	
	for (const score of scoreboard) {
		const displayName = userProfileCache.getDisplayName(score.userId)

		console.log("SCORE ENTRY:", score)
		console.log("USERID TYPE:", typeof score.userId, score.userId)

		result.push(
			<UiEntity
				key={`ui_Scoreboard_row_${score.userId}`}
				uiTransform={{
					width: '100%',
				}}
				uiText={{
					value: `${displayName}: ${score.score}`,
				}}
			/>
		)
	}
	return result
}

// MARK: FuelUI
export function ScoreboardUI() {
	return (
		<UiEntity
			key={`ui_Fuel_root`}
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
				key={`ui_Fuel_outer`}
				uiTransform={{
					width         : "100%",
					height        : 256,
					borderRadius  : 32,
					overflow      : 'hidden',
					flexDirection : 'column',
					justifyContent: 'flex-start',
					borderColor   : darken(theme.colors.success, 0.05),
					borderWidth   : 5,
				}}
			>
				{getScoreboardRows()}
			</UiEntity>
		</UiEntity>
	)
}
