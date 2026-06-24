import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui/index'
import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { vhAsPixels, vwAsPixels } from '../utils/sizing'
import { userProfileCache } from 'src/shared/utils/userProfileCache'
import { EasingFunction, UiText } from '@dcl/sdk/ecs'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { tweenValue } from '../utils/tweens'
import { getUVsForIconAtlasRow, IconAtlasLabel } from '../utils/atlas'


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


eventBus.on(ClientEvents.GAME_ACTIVE, (data) => { toDefault() })
eventBus.on(ClientEvents.GAME_END,    (data) => { toHidden() })
//eventBus.on(ClientEvents.GAME_IDLE,   (data) => { toHidden() })

function toDefault() {
	tweenValue(elementPositionTop, POS_TOP_DEFAULT, 0.4, (v) => elementPositionTop = v), EasingFunction.EF_EASEOUTBACK
	//tweenValue(elementPositionRight, POS_RIGHT_DEFAULT, 0.4, (v) => elementPositionRight = v), EasingFunction.EF_EASEOUTBACK
	//elementWidth = WIDTH_DEFAULT
}

/* function toCentered() {
	tweenValue(elementPositionTop, POS_TOP_CENTERED, 0.4, (v) => elementPositionTop = v), EasingFunction.EF_EASECUBIC
	tweenValue(elementPositionRight, POS_RIGHT_CENTERED, 0.4, (v) => elementPositionRight = v), EasingFunction.EF_EASECUBIC
	elementWidth = WIDTH_CENTERED
}
 */
function toHidden() {
	tweenValue(elementPositionTop, POS_TOP_HIDDEN, 0.4, (v) => elementPositionTop = v), EasingFunction.EF_EASEOUTBACK
	//tweenValue(elementPositionRight, POS_RIGHT_DEFAULT, 0.4, (v) => elementPositionRight = v), EasingFunction.EF_EASEOUTBACK
	//elementWidth = WIDTH_DEFAULT
}

//const POS_HIDDEN  = -310
//const POS_VISIBLE = 160

const POS_RIGHT_DEFAULT  = 160
//const POS_RIGHT_CENTERED = vwAsPixels(50) - 128 // half the width

const POS_TOP_DEFAULT    = 10
//const POS_TOP_CENTERED   = vhAsPixels(50) - 128 // half the height
const POS_TOP_HIDDEN     = -310

const WIDTH_DEFAULT = 256
const WIDTH_CENTERED = 480 // half the width


//var elementPositionTop: number = POS_TOP_DEFAULT // DEBUG -REMOVE FOR PROD
var elementPositionTop: number = POS_TOP_HIDDEN
var elementPositionRight: number = POS_RIGHT_DEFAULT
var elementWidth: number = WIDTH_DEFAULT


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
					padding: { left: 10, right: 10, top: 5, bottom: 5 },
				}}
				uiBackground={{
					color: alpha(darken(theme.colors.primary, 0.2), 0.5),
				}}
			>
				<Label
					value={displayName}
					textAlign='middle-left'
					fontSize={22}
					color={theme.colors.light}
				/>
				<Label
					value={score.toString()}
					textAlign='middle-right'
					fontSize={22}
					color={theme.colors.light}
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
				width         : '100%',
				height        : '100%',
				flexDirection : 'column',
				justifyContent: 'flex-start',
				padding       : { top: 8 },
			}}
		>
			<UiEntity
				key={`ui_Scoreboard_outer`}
				uiTransform={{
					width         : elementWidth,
					height        : 256,
					borderRadius  : 32,
					overflow      : 'hidden',
					flexDirection : 'column',
					borderColor   : darken(theme.colors.info, 0.05),
					borderWidth   : 5,
					justifyContent: 'flex-start',
					padding       : { bottom: 10 },
					position      : { right: elementPositionRight, top: elementPositionTop },
					positionType  : 'absolute',
					
				}}
				uiBackground={{
					color: alpha(theme.colors.info, 0.4),
				}}
			>
				<UiEntity
					key={`ui_Scoreboard_rows`}
					uiTransform={{
						width: '100%',
						height: "auto",
						alignContent: 'center',
						justifyContent: 'center',
						padding       : { top: 10, bottom: 4 },
					}}
					uiBackground={{
						color: alpha(theme.colors.info, 0.7),
					}}
				>	
					<UiEntity
						key={`ui_Combo_inner_image`}
						uiTransform={{
							width       : 256,
							height      : 64,
						}}
						uiBackground={{
							texture    : { src: "assets/images/ui/atlas-gui-labels.png" },
							textureMode: 'stretch',
							uvs        : getUVsForIconAtlasRow(IconAtlasLabel.POINT),
						}}
					/>
				</UiEntity>
				{getScoreboardRows()}
			</UiEntity>
		</UiEntity>
	)
}
