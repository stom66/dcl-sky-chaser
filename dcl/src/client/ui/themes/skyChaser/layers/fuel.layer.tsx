import * as utils from '@dcl-sdk/utils'
import { engine } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs from '@dcl/sdk/react-ecs'
import {
	getTheme,
	Icon,
	Layer,
	ProgressBarImage,
	PropsController,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { fuelFillAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { C_PlayerFuel, C_SpectatorMode, ComponentStore } from 'src/shared/components/componentStore'
import { GameStatus } from 'src/shared/enums'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


/** Native art sizes (`fuel-fg` is 2× the bg/fill height; origins are centered). */
const FG_ART_WIDTH     = 256
const FG_ART_HEIGHT    = 1024
const INNER_ART_HEIGHT = 512

/** `isMobile()` is unreliable at module import — read it at render time. */
const DISPLAY_SCALE_MOBILE  = 0.42
const DISPLAY_SCALE_DESKTOP = 0.6

const ARROW_ART_SIZE = 157
const ARROW_ART_TOP  = 72

type GaugeLayout = {
	width        : number
	height       : number
	contentInset : { top: number; right: number; bottom: number; left: number }
	arrowSize    : number
	arrowTop     : number
	arrowLeft    : number
}

const FUEL_BG_SRC    = 'assets/images/ui/fuel-bg.png'
const FUEL_FG_SRC    = 'assets/images/ui/fuel-fg.png'
const FUEL_ARROW_SRC = 'assets/images/ui/fuel-arrow.png'

/** No nine-slice caps — bg/border are full-frame chrome. */
const FUEL_TEXTURE_SLICES = {
	top   : 0,
	right : 0,
	bottom: 0,
	left  : 0,
}

const ARROW_DEG_EMPTY = -90
const ARROW_DEG_FULL  =  90

/**
 * Set `true` to step fuel through debug values (bypasses live `C_PlayerFuel`).
 * Kept for layout / lerp testing — leave off in normal play.
 */
const DEBUG_FUEL_ENABLED     = false
const DEBUG_FUEL_STEPS       = [0, 25, 50, 75, 100, 120]
const DEBUG_FUEL_INTERVAL_MS = 2000
const DEBUG_FUEL_MAX         = 100

type FuelProps = {
	value        : number
	maxValue     : number
	arrowDegrees : number
}


// MARK: getGaugeLayout
/** Fuel gauge sizes for the current platform (`isMobile()` is wrong at import). */
function getGaugeLayout(): GaugeLayout {
	const displayScale = isMobile() ? DISPLAY_SCALE_MOBILE : DISPLAY_SCALE_DESKTOP
	const width        = FG_ART_WIDTH * displayScale
	const height       = FG_ART_HEIGHT * displayScale
	const innerHeight  = INNER_ART_HEIGHT * displayScale
	const arrowSize    = ARROW_ART_SIZE * displayScale
	const arrowTop     = ARROW_ART_TOP * displayScale

	return {
		width,
		height,
		contentInset: {
			top   : (height - innerHeight) / 2,
			right : 0,
			bottom: (height - innerHeight) / 2,
			left  : 0,
		},
		arrowSize,
		arrowTop,
		arrowLeft: (width - arrowSize) / 2,
	}
}


// MARK: fuelValueToArrowDegrees
/** Maps fuel value into needle degrees (−90 empty … +90 full). */
function fuelValueToArrowDegrees(
	value   : number,
	maxValue: number,
): number {
	if (maxValue <= 0) return ARROW_DEG_EMPTY
	const t = Math.min(1, Math.max(0, value / maxValue))
	return ARROW_DEG_EMPTY + t * (ARROW_DEG_FULL - ARROW_DEG_EMPTY)
}


// MARK: FuelLayer
/**
 * Vertical fuel gauge (Right zone). Shows on `GAME_ACTIVE`, hides on `GAME_END`.
 * Value from `C_PlayerFuel.PlayerFuel`; needle lerps −90°…+90°.
 */
export class FuelLayer extends Layer {
	private debugFuelTimer: number | null = null
	private debugFuelStepIndex = 0
	private arrowTweenGeneration = 0

	constructor() {
		super({
			id         : 'skyChaser-fuel',
			zone       : ZoneType.Right,
			canBeHidden: true,
			startHidden: false,
			uiTransform: {
				justifyContent: 'center',
				alignItems    : 'flex-end',
			},
		})

		const initial  = ComponentStore.getFuelValue()
		const value    = initial.maxValue > 0 ? initial.value    : 100
		const maxValue = initial.maxValue > 0 ? initial.maxValue : 100

		this.props = new PropsController<FuelProps>({
			value,
			maxValue,
			arrowDegrees: fuelValueToArrowDegrees(value, maxValue),
		})

		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			this.syncVisibility()
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			this.hide()
		})

		ComponentStore.onComponentChange(C_PlayerFuel.PlayerFuel, (data) => {
			if (this.debugFuelTimer !== null) return
			this.setFuel(data?.value ?? 0, data?.maxValue ?? 100)
		})
		ComponentStore.onComponentChange(C_SpectatorMode.SpectatorMode, () => {
			this.syncVisibility()
		})

		// if (DEBUG_FUEL_ENABLED) this.startDebugFuelCycle()
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


	// MARK: setFuel
	/** Updates fuel value/max and linearly lerps the needle to match. */
	setFuel(
		value   : number,
		maxValue: number,
	) {
		this.props!.set('value',    value)
		this.props!.set('maxValue', maxValue)
		this.tweenArrowDegrees(fuelValueToArrowDegrees(value, maxValue))
	}


	// MARK: tweenArrowDegrees
	/** Linear lerp of `arrowDegrees` toward `target` (same duration as the bar). */
	private tweenArrowDegrees(target: number) {
		const from = this.props!.get('arrowDegrees') as number
		if (from === target) return

		const duration   = getTheme().animation.progressBarLerpDurationDefault
		const generation = ++this.arrowTweenGeneration

		if (duration <= 0) {
			this.props!.set('arrowDegrees', target)
			return
		}

		let elapsed = 0

		const system = (dt: number) => {
			if (generation !== this.arrowTweenGeneration) {
				engine.removeSystem(system)
				return
			}

			elapsed += dt
			const t = Math.min(elapsed / duration, 1)
			this.props!.set('arrowDegrees', from + (target - from) * t)

			if (t >= 1) {
				this.props!.set('arrowDegrees', target)
				engine.removeSystem(system)
			}
		}

		engine.addSystem(system)
	}


	// MARK: startDebugFuelCycle
	/**
	 * DEBUG: steps `value` through 0→120 (25% increments) every 2s.
	 * Enable via `DEBUG_FUEL_ENABLED` (and uncomment the constructor call).
	 */
	startDebugFuelCycle() {
		if (!DEBUG_FUEL_ENABLED) return
		if (this.debugFuelTimer !== null) return

		this.setFuel(DEBUG_FUEL_STEPS[this.debugFuelStepIndex], DEBUG_FUEL_MAX)

		this.debugFuelTimer = utils.timers.setInterval(() => {
			this.debugFuelStepIndex = (this.debugFuelStepIndex + 1) % DEBUG_FUEL_STEPS.length
			this.setFuel(DEBUG_FUEL_STEPS[this.debugFuelStepIndex], DEBUG_FUEL_MAX)
		}, DEBUG_FUEL_INTERVAL_MS)
	}


	// MARK: stopDebugFuelCycle
	/** DEBUG: stops the stepper so live `C_PlayerFuel` updates apply again. */
	stopDebugFuelCycle() {
		if (this.debugFuelTimer === null) return
		utils.timers.clearInterval(this.debugFuelTimer)
		this.debugFuelTimer = null
	}


	// MARK: body
	protected body() {
		const layout   = getGaugeLayout()
		const value    = this.props!.get('value') as number
		const maxValue = this.props!.get('maxValue') as number
		const arrowDeg = this.props!.get('arrowDegrees') as number

		if (this.uiTransform) {
			this.uiTransform.width          = layout.width
			this.uiTransform.justifyContent = isMobile() ? 'flex-start' : 'center'
		}

		return [
			<ProgressBarImage
				key            = "fuel-bar"
				id             = "skyChaser-fuel-bar"
				value          = {value}
				minValue       = {0}
				maxValue       = {maxValue}
				fillFrom       = "bottom"
				orientation    = "vertical"
				width          = {layout.width}
				height         = {layout.height}
				contentInset   = {layout.contentInset}
				borderWidth    = {0}
				borderRadius   = {0}
				textureSlices  = {FUEL_TEXTURE_SLICES}
				atlas          = {fuelFillAtlas}
				uvCell         = {{ xStart: 1, yStart: 1 }}
				uvCropWithFill = {true}
				textures       = {{
					background: FUEL_BG_SRC,
					border    : FUEL_FG_SRC,
				}}
			>
				<Icon
					key         = "fuel-arrow"
					src         = {FUEL_ARROW_SRC}
					width       = {layout.arrowSize}
					height      = {layout.arrowSize}
					rotate      = {arrowDeg}
					iconColor   = {Color4.White()}
					uiTransform = {{
						positionType: 'absolute',
						position    : { top: layout.arrowTop, left: layout.arrowLeft },
						zIndex      : 1,
					}}
				/>
			</ProgressBarImage>,
		]
	}
}

export const fuelLayer = new FuelLayer()
