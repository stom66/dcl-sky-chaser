import * as utils from '@dcl-sdk/utils'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { PositionUnit } from '@dcl/sdk/react-ecs'
import { clearToastGroup, Icon, showToast, UiBox } from '@stom66/dcl-ui-component-kit'

import { hintsAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { ComponentStore } from 'src/shared/components/componentStore'
import { GameStatus } from 'src/shared/enums'
import { IS_DEV } from 'src/shared/settings'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'

/** Matches old `ui.hints` display size (half of the 1024×~205 atlas row). */
const HINT_WIDTH  = 512
const HINT_HEIGHT = 104
/** Idle dock nudge (past toast `topRight` `right: 25%`). */
const HINT_OFFSET_LEFT_IDLE  = '25vw'
/** Tighter nudge while a round is in progress (HUD takes the far-right). */
const HINT_OFFSET_LEFT_MATCH = '18vw'

const HINT_COUNT                = 10
const TIME_BETWEEN_HINTS_MS     = IS_DEV ? 1000 * 5 : 1000 * 30
const TIME_TO_SHOW_HINT_S       = IS_DEV ? 2.5 : 7.5
const SHOW_HINTS_AGAIN_AFTER_MS = 1000 * 60 * 5
const FIRST_HINT_DELAY_MS       = 1000 * 2

const TOAST_GROUP = 'skyChaser-hints'

let isEnabled     = false
let isInitialized = false
/** Next UV row to show (1-based, bottom → top). Decrements each show. */
let nextHintRow   = HINT_COUNT
let betweenTimer  : number | null = null
let restartTimer  : number | null = null


// MARK: getHintOffsetLeft
/** Left offset for the current game status (live — toast content re-reads each frame). */
function getHintOffsetLeft(): PositionUnit {
	return ComponentStore.getGameStatus() === GameStatus.IDLE
		? HINT_OFFSET_LEFT_IDLE as PositionUnit
		: HINT_OFFSET_LEFT_MATCH as PositionUnit
}


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
			<UiBox
				key         = {`hint-offset-${hintRow}`}
				uiTransform = {{
					width       : '100%',
					height      : '100%',
					positionType: 'relative',
					position    : { left: getHintOffsetLeft() },
				}}
			>
				<Icon
					key       = {`hint-icon-${hintRow}`}
					src       = {hintsAtlas.source}
					uvs       = {hintsAtlas.row(hintRow)}
					width     = "100%"
					height    = "100%"
					iconColor = {Color4.White()}
				/>
			</UiBox>
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


// MARK: initHints
/**
 * Starts the hint cycle after load (matches old always-on behaviour).
 * Call once after `SetupUiComponentKit` (toast host must be in the layer list).
 */
export function initHints() {
	if (isInitialized) return
	isInitialized = true

	eventBus.on(ClientEvents.LOAD_COMPLETE, () => {
		enableHints()
	})
}
