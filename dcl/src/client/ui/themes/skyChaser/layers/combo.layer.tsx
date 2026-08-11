import * as utils from '@dcl-sdk/utils'
import { engine } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs from '@dcl/sdk/react-ecs'
import {
	Column,
	IconNumber,
	Layer,
	ProgressBarImage,
	PropsController,
	UiBox,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { charsNumbersAtlas, progressFillAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { C_Combo, ComponentStore } from 'src/shared/components/componentStore'
import { GameSettings } from 'src/shared/settings'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


/** Same progress chrome as `roundTimer` (`progress-fg` is 2× bg/fill height). */
const FG_ART_WIDTH     = 1024
const FG_ART_HEIGHT    = 256
const INNER_ART_HEIGHT = 128

/** Half of the round-timer scale — combo stack stays smaller than the countdown. */
const DISPLAY_SCALE = 0.325

const BAR_WIDTH        = FG_ART_WIDTH * DISPLAY_SCALE
const BAR_HEIGHT       = FG_ART_HEIGHT * DISPLAY_SCALE
const BAR_INNER_HEIGHT = INNER_ART_HEIGHT * DISPLAY_SCALE

const BAR_CONTENT_INSET = {
	top   : (BAR_HEIGHT - BAR_INNER_HEIGHT) / 2,
	right : 0,
	bottom: (BAR_HEIGHT - BAR_INNER_HEIGHT) / 2,
	left  : 0,
}

const PROGRESS_BG_SRC = 'assets/images/ui/progress-bg.png'
const PROGRESS_FG_SRC = 'assets/images/ui/progress-fg.png'

/** No nine-slice caps — bg/border are full-frame chrome. */
const PROGRESS_TEXTURE_SLICES = {
	top   : 0,
	right : 0,
	bottom: 0,
	left  : 0,
}

/**
 * Combo badge (`combo-bg.png`). Same width as the cooldown bar; 2:1 art ratio.
 * Tune `NUMBER_*` like pigeonCounter — plain display px, not artboard centers.
 */
const COMBO_WIDTH  = BAR_WIDTH
const COMBO_HEIGHT = BAR_WIDTH / 2

const NUMBER_WIDTH  = 64
const NUMBER_HEIGHT = 48
const NUMBER_TOP    = 56
const NUMBER_LEFT   = 214

const COMBO_BG_SRC        = 'assets/images/ui/combo-bg.png'
const COMBO_BG_MARGIN_TOP = -20

const STACK_HEIGHT = BAR_HEIGHT + COMBO_HEIGHT + COMBO_BG_MARGIN_TOP

/**
 * Set `true` to step combo 1 → `COMBO_MAX_VALUE` (bypasses live `C_Combo`).
 * Kept for layout testing — leave off in normal play.
 */
const DEBUG_COMBO_ENABLED  = true
const DEBUG_COMBO_START_MS = 2000
const DEBUG_COMBO_STEP_MS  = 1000
const DEBUG_COMBO_HIDE_MS  = 3000

type ComboProps = {
	value      : number
	remainingMs: number
}


// MARK: ComboLayer
/**
 * TopCenter combo HUD: round-timer-style cooldown bar above `combo-bg.png` with
 * an overlaid `IconNumber`. Shows on `GAME_ACTIVE`, hides on `GAME_END`.
 */
export class ComboLayer extends Layer {
	private lastUpdatedTime = 0
	private tickSystem: ((dt: number) => void) | null = null

	private debugStartTimer: number | null = null
	private debugStepTimer : number | null = null
	private debugHideTimer : number | null = null

	constructor() {
		super({
			id         : 'skyChaser-combo',
			zone       : ZoneType.TopCenter,
			canBeHidden: true,
			startHidden: true,
			uiTransform: {
				// Do not set a fixed width here — that replaces TopCenter’s 50%
				// slot and pins to `left: 25%`, looking left-biased. Keep the
				// preset width and center the stack with justifyContent.
				height        : STACK_HEIGHT,
				justifyContent: 'center',
				alignItems    : 'flex-start',
			},
		})

		this.props = new PropsController<ComboProps>({
			value      : 0,
			remainingMs: GameSettings.COMBO_COOLDOWN_TIME,
		})

		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			if (this.isDebugRunning()) return
			this.startTick()
			this.show()
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			if (this.isDebugRunning()) return
			this.stopTick()
			this.hide()
		})

		ComponentStore.onComponentChange(C_Combo.Combo, (data) => {
			if (this.isDebugRunning()) return

			this.props!.set('value', data?.value ?? 0)
			this.lastUpdatedTime = data?.lastUpdatedTime ?? 0
			this.refreshRemaining()
		})

		if (DEBUG_COMBO_ENABLED) this.startDebugComboCycle()
	}


	// MARK: isDebugRunning
	/** True while any debug timer is active (blocks live combo updates). */
	private isDebugRunning(): boolean {
		return this.debugStartTimer !== null
			|| this.debugStepTimer  !== null
			|| this.debugHideTimer  !== null
	}


	// MARK: setCombo
	/** Writes combo value, resets cooldown clock, and refreshes the bar. */
	setCombo(value: number) {
		this.props!.set('value', value)
		this.lastUpdatedTime = Date.now()
		this.refreshRemaining()
	}


	// MARK: refreshRemaining
	/**
	 * Writes cooldown remaining into props. At combo `1` the bar stays full
	 * (matches old `ui.combo` `ratio = 0` special case).
	 */
	private refreshRemaining() {
		const value = this.props!.get('value') as number

		if (value === 1) {
			this.props!.set('remainingMs', GameSettings.COMBO_COOLDOWN_TIME)
			return
		}

		const elapsed     = Date.now() - this.lastUpdatedTime
		const remainingMs = Math.max(0, GameSettings.COMBO_COOLDOWN_TIME - elapsed)
		this.props!.set('remainingMs', remainingMs)
	}


	// MARK: startTick
	/** Per-frame cooldown update while the round is active. */
	private startTick() {
		if (this.tickSystem !== null) return

		this.tickSystem = () => {
			this.refreshRemaining()
		}
		engine.addSystem(this.tickSystem)
	}


	// MARK: stopTick
	/** Stops the per-frame cooldown update. */
	private stopTick() {
		if (this.tickSystem === null) return
		engine.removeSystem(this.tickSystem)
		this.tickSystem = null
	}


	// MARK: startDebugComboCycle
	/**
	 * DEBUG: after a short delay sets combo to 1, then +1/s until `COMBO_MAX_VALUE`,
	 * then hides. Enable via `DEBUG_COMBO_ENABLED`.
	 */
	startDebugComboCycle() {
		if (!DEBUG_COMBO_ENABLED) return
		if (this.isDebugRunning()) return

		this.debugStartTimer = utils.timers.setTimeout(() => {
			this.debugStartTimer = null
			this.startTick()
			this.setCombo(1)
			this.show()

			this.debugStepTimer = utils.timers.setInterval(() => {
				const next = (this.props!.get('value') as number) + 1
				this.setCombo(next)

				if (next >= GameSettings.COMBO_MAX_VALUE) {
					this.stopDebugComboCycle()
					this.debugHideTimer = utils.timers.setTimeout(() => {
						this.debugHideTimer = null
						this.stopTick()
						this.hide()
					}, DEBUG_COMBO_HIDE_MS)
				}
			}, DEBUG_COMBO_STEP_MS)
		}, DEBUG_COMBO_START_MS)
	}


	// MARK: stopDebugComboCycle
	/** DEBUG: clears the step interval so the hide delay (or live updates) can continue. */
	stopDebugComboCycle() {
		if (this.debugStepTimer !== null) {
			utils.timers.clearInterval(this.debugStepTimer)
			this.debugStepTimer = null
		}
	}


	// MARK: body
	protected body() {
		const value       = this.props!.get('value') as number
		const remainingMs = this.props!.get('remainingMs') as number

		return [
			<Column
				key            = "combo-stack"
				cols           = {12}
				spacing        = {0}
				alignItems     = "center"
				justifyContent = "flex-start"
			>

				<UiBox
					key         = "combo-bg"
					width       = {COMBO_WIDTH}
					height      = {COMBO_HEIGHT}
					borderWidth = {0}
					overflow    = "hidden"
					margin      = {{ top: COMBO_BG_MARGIN_TOP }}
					uiBackground = {{
						texture    : { src: COMBO_BG_SRC, wrapMode: 'clamp' },
						textureMode: 'stretch',
						color      : Color4.White(),
					}}
				>
					<IconNumber
						key         = "combo-value"
						value       = {value}
						width       = {NUMBER_WIDTH}
						height      = {NUMBER_HEIGHT}
						atlas       = {charsNumbersAtlas}
						iconColor   = {Color4.White()}
						uiTransform = {{
							positionType: 'absolute',
							position    : { top: NUMBER_TOP, left: NUMBER_LEFT },
						}}
					/>
				</UiBox>

				<ProgressBarImage
					key            = "combo-cooldown-bar"
					id             = "skyChaser-combo-cooldown-bar"
					value          = {remainingMs}
					minValue       = {0}
					maxValue       = {GameSettings.COMBO_COOLDOWN_TIME}
					fillFrom       = "left"
					orientation    = "horizontal"
					width          = {BAR_WIDTH}
					height         = {BAR_HEIGHT}
					contentInset   = {BAR_CONTENT_INSET}
					margin         = {{ top: COMBO_BG_MARGIN_TOP*2.5 }}
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
				/>
			</Column>,
		]
	}
}

export const comboLayer = new ComboLayer()
