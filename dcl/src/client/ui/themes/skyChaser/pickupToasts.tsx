import { Color4 } from '@dcl/sdk/math'
import ReactEcs from '@dcl/sdk/react-ecs'
import { Icon, IconNumber, showToast, UiBox } from '@stom66/dcl-ui-component-kit'

import { charsNumbersAtlas, toastPickupAtlas } from 'src/client/ui/themes/skyChaser/atlases'


/** Stub display size — tune once `toast-pickup.png` is in. */
const TOAST_WIDTH  = 256
const TOAST_HEIGHT = 128

export type PickupToastKind = 'score' | 'combo' | 'fuel' | 'strike'

const NUMBER_HEIGHT = 48
/** Centered in the toast, then nudged per kind. Negative left = left of center. */
const NUMBER_OFFSET_LEFT: Record<PickupToastKind, number> = {
	score : -10,
	combo : -10,
	fuel  : -10,
	strike:  20,
}

const TIME_TO_SHOW_S = 1.5

const TOAST_GROUP = 'skyChaser-pickup'


// MARK: formatPickupAmount
/** Formats a pickup delta for `IconNumber` (e.g. `1` → `+1`). */
function formatPickupAmount(amount: number): string {
	const rounded = Math.round(amount)
	if (rounded < 0) return `${rounded}`
	return `+${rounded}`
}


// MARK: renderPickupToast
/**
 * Image-row background with a centered `IconNumber`, then a relative left nudge.
 */
function renderPickupToast(
	kind  : PickupToastKind,
	label : string,
) {
	return (
		<UiBox
			key            = {`pickup-toast-${kind}`}
			width          = "100%"
			height         = "100%"
			alignItems     = "center"
			justifyContent = "center"
		>
			<Icon
				key          = {`pickup-toast-${kind}-bg`}
				src          = {toastPickupAtlas.source}
				uvs          = {toastPickupAtlas.uv[kind]}
				width        = "100%"
				height       = "100%"
				iconColor    = {Color4.White()}
				positionType = "absolute"
				position     = {{ top: 0, right: 0, bottom: 0, left: 0 }}
			/>
			<UiBox
				key          = {`pickup-toast-${kind}-value-wrap`}
				positionType = "relative"
				position     = {{ left: NUMBER_OFFSET_LEFT[kind] }}
			>
				<IconNumber
					key       = {`pickup-toast-${kind}-value`}
					value     = {label}
					height    = {NUMBER_HEIGHT}
					atlas     = {charsNumbersAtlas}
					iconColor = {Color4.White()}
				/>
			</UiBox>
		</UiBox>
	)
}


// MARK: showPickupToast
/**
 * Shows a mid-match pickup toast for score, combo, fuel, or strike.
 * Uses ToastHost (not a dedicated Layer) — same path as hints.
 */
export function showPickupToast(
	kind  : PickupToastKind,
	amount: number,
): void {
	const label = formatPickupAmount(amount)

	console.log(`PickupToasts: showPickupToast: kind=${kind} amount=${amount}`)

	showToast({
		id           : `pickup-${kind}`,
		position     : 'top',
		group        : TOAST_GROUP,
		groupPolicy  : 'replace',
		duration     : TIME_TO_SHOW_S,
		isDismissable: false,
		scaleIn      : true,
		scaleOut     : true,
		scalePulse   : true,
		width        : TOAST_WIDTH,
		height       : TOAST_HEIGHT,
		content      : () => renderPickupToast(kind, label),
	})
}


// MARK: showScoreToast
/** Balloon / points pickup toast (`toast-pickup` score row). */
export function showScoreToast(amount: number): void {
	showPickupToast('score', amount)
}


// MARK: showComboToast
/** Speed-ring combo pickup toast (`toast-pickup` combo row). */
export function showComboToast(amount: number): void {
	showPickupToast('combo', amount)
}


// MARK: showFuelToast
/** Fuel pickup toast (`toast-pickup` fuel row). */
export function showFuelToast(amount: number): void {
	showPickupToast('fuel', amount)
}


// MARK: showStrikeToast
/** Bird-strike pickup toast (`toast-pickup` strike row). */
export function showStrikeToast(amount: number): void {
	showPickupToast('strike', amount)
}
