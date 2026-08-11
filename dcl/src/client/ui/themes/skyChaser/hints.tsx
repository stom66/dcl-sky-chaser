import * as utils from '@dcl-sdk/utils'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs from '@dcl/sdk/react-ecs'
import { clearToastGroup, Icon, showToast } from '@stom66/dcl-ui-component-kit'

import { hintsAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { GameStatus } from 'src/shared/enums'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


/** Matches old `ui.hints` display size (half of the 1024×~205 atlas row). */
const HINT_WIDTH  = 512
const HINT_HEIGHT = 104

const HINT_COUNT                = 10
const TIME_BETWEEN_HINTS_MS     = 1000 * 30
const TIME_TO_SHOW_HINT_S       = 7.5
const SHOW_HINTS_AGAIN_AFTER_MS = 1000 * 60 * 5
const FIRST_HINT_DELAY_MS       = 1000 * 2

const TOAST_GROUP = 'skyChaser-hints'

let isEnabled     = false
let isInitialized = false
/** Next UV row to show (1-based, bottom → top). Decrements each show. */
let nextHintRow   = HINT_COUNT
let betweenTimer  : number | null = null
let restartTimer  : number | null = null


// MARK: clearHintTimers
/** Clears pending between / restart timers. */
function clearHintTimers() {
	if (betweenTimer !== null) {
		utils.timers.clearTimeout(betweenTimer)
		betweenTimer = null
	}
	if (restartTimer !== null) {
		utils.timers.clearTimeout(restartTimer)
		restartTimer = null
	}
}


// MARK: showNextHint
/** Shows the next hint toast, or schedules a full cycle restart when exhausted. */
function showNextHint() {
	if (!isEnabled) return

	betweenTimer = null

	if (nextHintRow < 1) {
		disableHints()
		restartTimer = utils.timers.setTimeout(() => {
			restartTimer = null
			enableHints()
		}, SHOW_HINTS_AGAIN_AFTER_MS)
		return
	}

	const hintRow = nextHintRow
	nextHintRow--

	showToast({
		id           : `hint_${hintRow}`,
		position     : 'topRight',
		group        : TOAST_GROUP,
		groupPolicy  : 'replace',
		duration     : TIME_TO_SHOW_HINT_S,
		isDismissable: true,
		showFrom     : 'right',
		hideTo       : 'right',
		width        : HINT_WIDTH,
		height       : HINT_HEIGHT,
		content      : () => (
			<Icon
				key       = {`hint-icon-${hintRow}`}
				src       = {hintsAtlas.source}
				uvs       = {hintsAtlas.row(hintRow)}
				width     = "100%"
				height    = "100%"
				iconColor = {Color4.White()}
			/>
		),
	})

	betweenTimer = utils.timers.setTimeout(() => {
		showNextHint()
	}, TIME_BETWEEN_HINTS_MS)
}


// MARK: enableHints
/**
 * Starts the rotating hint toast cycle (top-right dock).
 * Safe to call repeatedly — no-ops when already enabled.
 */
export function enableHints() {
	if (isEnabled) return

	isEnabled   = true
	nextHintRow = HINT_COUNT
	clearHintTimers()
	clearToastGroup(TOAST_GROUP)

	betweenTimer = utils.timers.setTimeout(() => {
		showNextHint()
	}, FIRST_HINT_DELAY_MS)
}


// MARK: disableHints
/**
 * Stops the hint cycle, clears pending timers, and dismisses active hint toasts.
 */
export function disableHints() {
	if (!isEnabled && betweenTimer === null && restartTimer === null) {
		clearToastGroup(TOAST_GROUP)
		return
	}

	isEnabled = false
	clearHintTimers()
	clearToastGroup(TOAST_GROUP)
}


// MARK: syncHintsToGameStatus
/** Hints only while the synced game is idle. */
function syncHintsToGameStatus() {
	if (ComponentStore.getGameStatus() === GameStatus.IDLE) {
		enableHints()
	} else {
		disableHints()
	}
}


// MARK: initHints
/**
 * Wires hint enable/disable to load + game-status events.
 * Call once after `SetupUiComponentKit` (toast host must be in the layer list).
 */
export function initHints() {
	if (isInitialized) return
	isInitialized = true

	eventBus.on(ClientEvents.LOAD_COMPLETE, () => {
		syncHintsToGameStatus()
	})
	eventBus.on(ClientEvents.GAME_IDLE, () => {
		enableHints()
	})
	eventBus.on(ClientEvents.GAME_STARTING, () => {
		disableHints()
	})
	eventBus.on(ClientEvents.GAME_ACTIVE, () => {
		disableHints()
	})
	eventBus.on(ClientEvents.GAME_END, () => {
		disableHints()
	})

	ComponentStore.onComponentChange(C_GameData.GameData, () => {
		syncHintsToGameStatus()
	})
}
