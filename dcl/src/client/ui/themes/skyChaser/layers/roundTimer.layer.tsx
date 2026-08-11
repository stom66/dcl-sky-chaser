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

import { progressFillAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { GameSettings } from 'src/shared/settings'
import { clockSync } from 'src/shared/utils/clockSync'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


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

const PROGRESS_BG_SRC = 'assets/images/ui/progress-bg.png'
const PROGRESS_FG_SRC = 'assets/images/ui/progress-fg.png'

/** No nine-slice caps — bg/border are full-frame chrome. */
const PROGRESS_TEXTURE_SLICES = {
	top   : 0,
	right : 0,
	bottom: 0,
	left  : 0,
}

type RoundTimerProps = {
	remainingMs : number
	secondsLeft : number
	maxMs       : number
}

type RoundTimerSnapshot = {
	remainingMs : number
	maxMs       : number
}


// MARK: getRoundTimerSnapshot
/**
 * Remaining ms and bar max for the current phase: pre-start countdown
 * (`COUNTDOWN_DURATION`) while `startTime` is still in the future, otherwise
 * the active round (`GAME_DURATION`).
 */
function getRoundTimerSnapshot(gameStartTime: number): RoundTimerSnapshot {
	if (gameStartTime <= 0) {
		return {
			remainingMs: 0,
			maxMs      : GameSettings.GAME_DURATION,
		}
	}

	const localStart = clockSync.toLocalTime(gameStartTime)
	const now        = Date.now()

	if (localStart > now) {
		return {
			remainingMs: localStart - now,
			maxMs      : GameSettings.COUNTDOWN_DURATION,
		}
	}

	return {
		remainingMs: (localStart + GameSettings.GAME_DURATION) - now,
		maxMs      : GameSettings.GAME_DURATION,
	}
}


// MARK: RoundTimerLayer
/**
 * BottomCenter round countdown. Shows during pre-start (`GAME_STARTING`) and
 * the active round (`GAME_ACTIVE`); hides on end/idle. Progress bar depletes
 * over `COUNTDOWN_DURATION` then `GAME_DURATION`; `IconNumber` shows seconds left.
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
			remainingMs : GameSettings.COUNTDOWN_DURATION,
			secondsLeft : Math.ceil(GameSettings.COUNTDOWN_DURATION / 1000),
			maxMs       : GameSettings.COUNTDOWN_DURATION,
		})

		eventBus.on(ClientEvents.GAME_STARTING, () => {
			this.beginTimer()
		})
		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			this.beginTimer()
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


	// MARK: beginTimer
	/** Syncs start time, refreshes remaining, starts the tick, and shows the layer. */
	private beginTimer() {
		this.gameStartTime = ComponentStore.getGameStartTime()
		this.refreshRemaining()
		this.startTick()
		this.show()
	}


	// MARK: refreshRemaining
	/** Writes remaining ms / seconds / bar max into the props store from synced start time. */
	private refreshRemaining() {
		const snapshot    = getRoundTimerSnapshot(this.gameStartTime)
		const remainingMs = Math.max(0, snapshot.remainingMs)
		this.props!.set('remainingMs', remainingMs)
		this.props!.set('secondsLeft', Math.ceil(remainingMs / 1000))
		this.props!.set('maxMs', snapshot.maxMs)
	}


	// MARK: startTick
	/** Per-frame remaining update while countdown or round is visible. */
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
		const maxMs       = this.props!.get('maxMs') as number

		return [
			<Row key="round-timer-root">
				<Icon
					key    = "round-timer-icon"
					src    = {"assets/images/ui/icon-clock.png"}
					width  = {128}
					height = {128}
					rotate = {-15}
				/>

				<ProgressBarImage
					key            = "round-timer-bar"
					id             = "skyChaser-round-timer-bar"
					value          = {remainingMs}
					minValue       = {0}
					maxValue       = {maxMs}
					fillFrom       = "left"
					orientation    = "horizontal"
					width          = {BAR_WIDTH}
					height         = {BAR_HEIGHT}
					contentInset   = {BAR_CONTENT_INSET}
					borderWidth    = {0}
					borderRadius   = {0}
					lerpDuration   = {0}
					textureSlices  = {PROGRESS_TEXTURE_SLICES}
					atlas          = {progressFillAtlas}
					uvCell         = {{ xStart: 1, yStart: 1 }}
					uvCropWithFill = {true}
					textures       = {{
						background: PROGRESS_BG_SRC,
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
