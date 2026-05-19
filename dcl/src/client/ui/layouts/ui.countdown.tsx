import { EasingFunction, engine } from '@dcl/sdk/ecs'
import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, lighten, theme } from 'src/client/ui/index'
import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { GameSettings } from 'src/shared/settings'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { tweenValue } from '../utils/tweens'
import { ClientMessaging } from 'src/client/clientMessaging'
import { clockSync } from 'src/shared/utils/clockSync'
import { GameStatus } from 'src/shared/enums'


/* eventBus.on(ClientEvents.GAME_ACTIVE, (data) => {
	tweenValue(elementPosition, POS_HIDDEN, 0.2, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
})
eventBus.on(ClientEvents.GAME_END, (data) => {
	tweenValue(elementPosition, POS_VISIBLE, 0.2, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
}) */

const POS_HIDDEN  = -256
const POS_VISIBLE = 0
var elementPosition: number = POS_VISIBLE


let gameStartTime       = 0
let remaining           = 0
let ratio               = remaining / GameSettings.COUNTDOWN_DURATION

let isInitialized = false

function getRemainingTime() {
	if (gameStartTime > Date.now()) {
		return gameStartTime - Date.now()
	} else {
		return (gameStartTime + GameSettings.GAME_DURATION) - Date.now()
	}
}

function getRatio() {
	if (gameStartTime > Date.now()) {
		return Math.ceil((remaining / GameSettings.COUNTDOWN_DURATION) * 100)
	} else {
		return Math.ceil((remaining / GameSettings.GAME_DURATION) * 100)
	}
}

ComponentStore.onComponentChange(C_GameData.GameData, (data) => {
	gameStartTime = clockSync.toLocalTime(data?.startTime ?? 0)

	remaining = getRemainingTime()
	ratio     = getRatio()
	
	console.log("CountdownUI: remaining", remaining, "ratio", ratio)

	if (isInitialized) return
	isInitialized = true
	engine.addSystem(updateRatio)
})


function updateRatio() {
	if (remaining < 0) {
		ratio = 0
		return
	}

	remaining = getRemainingTime()
	ratio     = getRatio()
}

function getStatusText() {
	const gameStatus = ComponentStore.getGameStatus()

	if (gameStatus === GameStatus.IDLE) {
		return "Start a game"
	}
	else if (gameStatus === GameStatus.STARTING) {
		return `Game starting: ${Math.ceil(remaining / 1000)}s`
	}
	else if (gameStatus === GameStatus.ACTIVE) {
		return `Game in progress: ${Math.ceil(remaining / 1000)}s`
	}
	else if (gameStatus === GameStatus.ENDING) {
		return `Game has ended`
	}
	else {
		return "..."
	}
}

var btnHover: boolean = false

// MARK: CountdownUI
export function CountdownUI() {
	return (
		<UiEntity
			key={`ui_Countdown_root`}
			uiTransform={{
				width         : "100%",
				height        : 128,
				flexDirection : 'row',
				justifyContent: 'center',
				alignContent  : 'center',
				alignItems    : 'center',
				positionType  : 'absolute',
				position      : { bottom: 0 },
			}}
		>
			<UiEntity
				key={`ui_Countdown_outer`}
				uiTransform={{
					width         : 420,
					height        : 90,
					borderRadius  : 45,
					overflow      : 'hidden',
					flexDirection : 'row',
					justifyContent: 'flex-start',
					borderColor   : btnHover ? lighten(theme.colors.primary, 0.2) : darken(theme.colors.primary, 0.05),
					borderWidth   : 5,
					alignItems    : 'center',
					positionType  : 'relative',
					position      : { bottom: elementPosition },
				}}
				onMouseEnter={() => {
					if (ComponentStore.getGameStatus() == GameStatus.IDLE) {
						btnHover = true
					}
				}}
				onMouseLeave={() => {
					btnHover = false
				}}
				onMouseDown={() => {
					if (ComponentStore.getGameStatus() == GameStatus.IDLE) {
						ClientMessaging.RequestNewGame()
					}
				}}

			>
				<UiEntity
					key={`ui_Countdown_inner`}
					uiTransform={{
						height       : '100%',
						width      : `${ratio}%`,
						alignContent: 'center',
					}}
					uiBackground={{
						color: alpha(theme.colors.primary, 1),
					}}
				/>
				<UiEntity
					key={`ui_Countdown_inner`}
					uiTransform={{
						width       : '100%',
						height      : '48',
						alignContent: 'center',
						positionType: 'absolute',
					}}
					uiText={{
						value    : getStatusText(),
						textAlign: 'middle-center',
						fontSize : 28
						
					}}
				/>
			</UiEntity>
		</UiEntity>
	)
}
