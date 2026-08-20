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
import { C_Combo, C_SpectatorMode, ComponentStore } from 'src/shared/components/componentStore'
import { GameStatus } from 'src/shared/enums'
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
const NUMBER_LEFT   = 210

const COMBO_BG_SRC        = 'assets/images/ui/combo-bg.png'
const COMBO_BG_MARGIN_TOP = -20

const STACK_HEIGHT = BAR_HEIGHT + COMBO_HEIGHT + COMBO_BG_MARGIN_TOP

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
			value      : 1,
			remainingMs: GameSettings.COMBO_COOLDOWN_TIME,
		})

		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			this.startTick()
			this.syncVisibility()
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			this.stopTick()
			this.hide()
		})

		ComponentStore.onComponentChange(C_Combo.Combo, (data) => {
			this.props!.set('value', data?.value ?? 0)
			this.lastUpdatedTime = data?.lastUpdatedTime ?? 0
			this.refreshRemaining()
		})
		ComponentStore.onComponentChange(C_SpectatorMode.SpectatorMode, () => {
			this.syncVisibility()
		})
	}


	// MARK: syncVisibility
	/** Shows during an active round unless spectating. */
	private syncVisibility() {
		if (ComponentStore.getSpectatorModeEnabled()) {
			this.hide()
			return
		}
		if (ComponentStore.getGameStatus() === GameStatus.ACTIVE) {
			this.show()
		} else {
			this.hide()
		}
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


	// MARK: body
	protected body() {
		const value       = this.props!.get('value') as number
		const remainingMs = this.props!.get('remainingMs') as number

		return [
			<Column
				key            = "combo-stack"
				width          = {COMBO_WIDTH}
				spacing        = {0}
				alignItems     = "center"
				justifyContent = "flex-start"
				flexGrow       = {0}
				flexShrink     = {0}
			>
				{/* Same size lock as ProgressBarImage — flexGrow alone does not stop mobile cross-axis stretch. */}
				<UiBox
					key         = "combo-bg"
					width       = {COMBO_WIDTH}
					height      = {COMBO_HEIGHT}
					minWidth    = {COMBO_WIDTH}
					maxWidth    = {COMBO_WIDTH}
					minHeight   = {COMBO_HEIGHT}
					maxHeight   = {COMBO_HEIGHT}
					borderWidth = {0}
					overflow    = "hidden"
					flexGrow    = {0}
					flexShrink  = {0}
					alignSelf   = "center"
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
					margin         = {{ top: COMBO_BG_MARGIN_TOP * 2.5 }}
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
