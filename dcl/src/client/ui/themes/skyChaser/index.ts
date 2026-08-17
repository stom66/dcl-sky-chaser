import { layers } from './layers'
import { theme } from './theme'

export { theme } from './theme'
export { layers } from './layers'
export { enableHints, disableHints, initHints } from './hints'
export { showComboToast, showFuelToast, showPickupToast, showScoreToast, showStrikeToast } from './pickupToasts'
export type { PickupToastKind } from './pickupToasts'


/**
 * skyChaser theme bundle.
 */
export const skyChaser = {
	theme,
	layers,
}
