import * as utils from '@dcl-sdk/utils'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs from '@dcl/sdk/react-ecs'
import {
	Background,
	IconNumber,
	Layer,
	PropsController,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { charsNumbersAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { C_PigeonCounter, ComponentStore } from 'src/shared/components/componentStore'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


const PANEL_WIDTH  = 256
const PANEL_HEIGHT = 128

/** Matches old `ui.pigeonCounter` digit placement on `bg-counter.png`. */
const COUNT_HEIGHT = 50
const COUNT_TOP    = 52
const COUNT_LEFT   = 22

const COUNTER_BG_SRC = 'assets/images/ui/bg-counter.png'

/**
 * Set `true` to drive the counter through a fake find sequence (bypasses live
 * `C_PigeonCounter`). Kept for layout testing — leave off in normal play.
 */
const DEBUG_PIGEON_COUNTER_ENABLED    = true
const DEBUG_PIGEON_COUNTER_MAX        = 10
const DEBUG_PIGEON_COUNTER_START_MS   = 4000
const DEBUG_PIGEON_COUNTER_STEP_MS    = 1000
const DEBUG_PIGEON_COUNTER_HIDE_MS    = 3000

type PigeonCounterProps = {
	count: number
}


// MARK: PigeonCounterLayer
/**
 * BottomRight pigeon find counter. Background chrome + `IconNumber` for `count`.
 * Shows when the count increases; hides on reset (0) or when all pigeons are found.
 */
export class PigeonCounterLayer extends Layer {
	private debugStartTimer: number | null = null
	private debugStepTimer : number | null = null
	private debugHideTimer : number | null = null

	constructor() {
		super({
			id         : 'skyChaser-pigeonCounter',
			zone       : ZoneType.BottomRight,
			canBeHidden: true,
			startHidden: true,
			uiTransform: {
				width         : PANEL_WIDTH,
				height        : PANEL_HEIGHT,
				justifyContent: 'flex-end',
				alignItems    : 'flex-end',
			},
		})

		this.props = new PropsController<PigeonCounterProps>({
			count: 0,
		})

		ComponentStore.onComponentChange(C_PigeonCounter.PigeonCounter, (data) => {
			if (this.isDebugRunning()) return

			const newCount  = data?.count ?? 0
			const prevCount = this.props!.get('count') as number

			this.props!.set('count', newCount)

			if (newCount > prevCount && this.visibility.isHidden) {
				this.show()
			}
			if (newCount === 0) {
				this.hide()
			}
		})

		eventBus.on(ClientEvents.PLAYER_FOUND_ALL_PIGEONS, () => {
			if (this.isDebugRunning()) return
			this.hide()
		})

		if (DEBUG_PIGEON_COUNTER_ENABLED) this.startDebugPigeonCycle()
	}


	// MARK: isDebugRunning
	/** True while any debug timer is active (blocks live counter updates). */
	private isDebugRunning(): boolean {
		return this.debugStartTimer !== null
			|| this.debugStepTimer  !== null
			|| this.debugHideTimer  !== null
	}


	// MARK: setCount
	/** Writes `count` and shows the panel when the value increases. */
	setCount(count: number) {
		const prevCount = this.props!.get('count') as number
		this.props!.set('count', count)

		if (count > prevCount && this.visibility.isHidden) {
			this.show()
		}
		if (count === 0) {
			this.hide()
		}
	}


	// MARK: startDebugPigeonCycle
	/**
	 * DEBUG: after 4s sets count to 1, then +1/s until 10, then hides after 3s.
	 * Enable via `DEBUG_PIGEON_COUNTER_ENABLED`.
	 */
	startDebugPigeonCycle() {
		if (!DEBUG_PIGEON_COUNTER_ENABLED) return
		if (this.isDebugRunning()) return

		this.debugStartTimer = utils.timers.setTimeout(() => {
			this.debugStartTimer = null
			this.setCount(1)

			this.debugStepTimer = utils.timers.setInterval(() => {
				const next = (this.props!.get('count') as number) + 1
				this.setCount(next)

				if (next >= DEBUG_PIGEON_COUNTER_MAX) {
					this.stopDebugPigeonCycle()
					this.debugHideTimer = utils.timers.setTimeout(() => {
						this.debugHideTimer = null
						this.hide()
					}, DEBUG_PIGEON_COUNTER_HIDE_MS)
				}
			}, DEBUG_PIGEON_COUNTER_STEP_MS)
		}, DEBUG_PIGEON_COUNTER_START_MS)
	}


	// MARK: stopDebugPigeonCycle
	/** DEBUG: clears the step interval so the hide delay (or live updates) can continue. */
	stopDebugPigeonCycle() {
		if (this.debugStepTimer !== null) {
			utils.timers.clearInterval(this.debugStepTimer)
			this.debugStepTimer = null
		}
	}


	// MARK: body
	protected body() {
		const count = this.props!.get('count') as number

		return [
			<Background
				key             = "pigeon-counter-chrome"
				textureSrc      = {COUNTER_BG_SRC}
				backgroundColor = {Color4.White()}
				borderRadius    = {0}
				borderWidth     = {0}
			/>,
			<IconNumber
				key         = "pigeon-counter-count"
				value       = {count}
				height      = {COUNT_HEIGHT}
				atlas       = {charsNumbersAtlas}
				iconColor   = {Color4.White()}
				uiTransform = {{
					positionType: 'absolute',
					position    : { top: COUNT_TOP, left: COUNT_LEFT },
				}}
			/>,
		]
	}
}

export const pigeonCounterLayer = new PigeonCounterLayer()
