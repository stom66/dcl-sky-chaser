import { engine } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs from '@dcl/sdk/react-ecs'
import {
	Icon,
	IconNumber,
	Layer,
	ProgressBarImage,
	PropsController,
	Row,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { GameSettings } from 'src/shared/settings'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { clockSync } from 'src/shared/utils/clockSync'


/** Native art: fg is 2× the bg/fill height (1024×256 vs 1024×128). */
const FG_ART_WIDTH     = 1024
const FG_ART_HEIGHT    = 256
const INNER_ART_HEIGHT = 128

const DISPLAY_SCALE = 0.65

const BAR_WIDTH        = FG_ART_WIDTH * DISPLAY_SCALE
const BAR_HEIGHT       = FG_ART_HEIGHT * DISPLAY_SCALE
const BAR_INNER_HEIGHT = INNER_ART_HEIGHT * DISPLAY_SCALE

const BAR_CONTENT_INSET = {
	top   : (BAR_HEIGHT - BAR_INNER_HEIGHT) / 2,
	right : 0,
	bottom: (BAR_HEIGHT - BAR_INNER_HEIGHT) / 2,
	left  : 0,
}

const SECONDS_ICON_HEIGHT = 40

const PROGRESS_BG_SRC   = 'assets/images/ui/progress-bg.png'
const PROGRESS_FILL_SRC = 'assets/images/ui/progress-fill.png'
const PROGRESS_FG_SRC   = 'assets/images/ui/progress-fg.png'

const PROGRESS_TEXTURE_SLICES = {
	top   : 0,
	right : 0,
	bottom: 0,
	left  : 0,
}

type RoundTimerProps = {
	remainingMs : number
	secondsLeft : number
}


// MARK: getRoundRemainingMs
/**
 * Milliseconds left in the active round (from synced `startTime` + `GAME_DURATION`).
 */
function getRoundRemainingMs(gameStartTime: number): number {
	if (gameStartTime <= 0) return 0

	const localStart = clockSync.toLocalTime(gameStartTime)
	return (localStart + GameSettings.GAME_DURATION) - Date.now()
}


// MARK: RoundTimerLayer
/**
 * BottomCenter round countdown. Image progress bar depletes over `GAME_DURATION`;
 * `IconNumber` shows whole seconds remaining. Shows on `GAME_ACTIVE`, hides on end/idle.
 */
export class RoundTimerLayer extends Layer {
	private gameStartTime = 0
	private tickSystem: ((dt: number) => void) | null = null

	constructor() {
		super({
			id         : 'skyChaser-roundTimer',
			zone       : ZoneType.BottomCenter,
			canBeHidden: true,
			startHidden: true,
			uiTransform: {
				height        : BAR_HEIGHT,
				justifyContent: 'center',
				alignItems    : 'flex-end',
			},
		})

		this.props = new PropsController<RoundTimerProps>({
			remainingMs : GameSettings.GAME_DURATION,
			secondsLeft : Math.ceil(GameSettings.GAME_DURATION / 1000),
		})

		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			this.gameStartTime = ComponentStore.getGameStartTime()
			this.refreshRemaining()
			this.startTick()
			this.show()
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			this.stopTick()
			this.hide()
		})
		eventBus.on(ClientEvents.GAME_IDLE, () => {
			this.stopTick()
			this.hide()
		})

		ComponentStore.onComponentChange(C_GameData.GameData, (data) => {
			this.gameStartTime = data?.startTime ?? 0
			this.refreshRemaining()
		})
	}


	// MARK: refreshRemaining
	/** Writes remaining ms / seconds into the props store from the synced start time. */
	private refreshRemaining() {
		const remainingMs = Math.max(0, getRoundRemainingMs(this.gameStartTime))
		this.props!.set('remainingMs', remainingMs)
		this.props!.set('secondsLeft', Math.ceil(remainingMs / 1000))
	}


	// MARK: startTick
	/** Per-frame remaining update while the round is active. */
	private startTick() {
		if (this.tickSystem !== null) return

		this.tickSystem = () => {
			this.refreshRemaining()
		}
		engine.addSystem(this.tickSystem)
	}


	// MARK: stopTick
	/** Stops the per-frame remaining update. */
	private stopTick() {
		if (this.tickSystem === null) return
		engine.removeSystem(this.tickSystem)
		this.tickSystem = null
	}


	// MARK: body
	protected body() {
		const remainingMs = this.props!.get('remainingMs') as number
		const secondsLeft = this.props!.get('secondsLeft') as number

		return [
			<Row key="round-timer-root">
				
				<Icon
					key          = "round-timer-icon"
					src          = {"assets/images/ui/icon-clock.png"}
					width        = {128}
					height       = {128}
					rotate       = {-15}
					/>

				<ProgressBarImage
					key           = "round-timer-bar"
					id            = "skyChaser-round-timer-bar"
					value         = {remainingMs}
					minValue      = {0}
					maxValue      = {GameSettings.GAME_DURATION}
					fillFrom      = "left"
					uvCropWithFill = {true}
					orientation   = "horizontal"
					width         = {BAR_WIDTH}
					height        = {BAR_HEIGHT}
					contentInset  = {BAR_CONTENT_INSET}
					borderWidth   = {0}
					borderRadius  = {0}
					lerpDuration  = {0}
					textureSlices = {PROGRESS_TEXTURE_SLICES}
					textures      = {{
						background: PROGRESS_BG_SRC,
						fill      : PROGRESS_FILL_SRC,
						border    : PROGRESS_FG_SRC,
					}}
					>
					<IconNumber
						key       = "round-timer-seconds"
						value     = {secondsLeft}
						height    = {SECONDS_ICON_HEIGHT}
						iconColor = {Color4.White()}
						/>
				</ProgressBarImage>
			</Row>
		]
	}
}

export const roundTimerLayer = new RoundTimerLayer()
