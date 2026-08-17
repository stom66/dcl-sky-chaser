import { Vector3 } from '@dcl/sdk/math'
import ReactEcs from '@dcl/sdk/react-ecs'
import {
	alpha,
	Background,
	ButtonText,
	Column,
	getTheme,
	Layer,
	SectionHeader,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { IS_DEV } from 'src/shared/settings'

import { FireworkLauncher } from 'src/client/fireworkLauncher'
import { PlayerMover } from 'src/client/playerMover'
import { showComboToast, showFuelToast, showScoreToast, showStrikeToast } from 'src/client/ui/themes/skyChaser/pickupToasts'


const PANEL_WIDTH = 220


// MARK: DebugLayer
/**
 * Local-only debug controls (Left zone). Mounted only when `IS_DEV` is true.
 * Teleport + firework spawn both use {@link PlayerMover.spawnPosition}.
 */
export class DebugLayer extends Layer {
	constructor() {
		super({
			id         : 'skyChaser-debug',
			zone       : ZoneType.Left,
			canBeHidden: false,
			uiTransform: {
				// `height: 'auto'` only shrink-wraps if an edge clears; flex-start
				// drops the Left strip’s `bottom` so the panel isn’t full-height.
				width         : PANEL_WIDTH,
				height        : 'auto',
				justifyContent: 'flex-start',
				alignItems    : 'flex-start',
			},
		})
	}


	// MARK: body
	protected body() {
		const theme = getTheme()

		return [
			<Background
				key             = "debug-chrome"
				backgroundColor = {alpha(theme.colors.body, 0.5)}
				borderRadius    = {8}
			/>,
			<Column
				key     = "debug-body"
				cols    = {12}
				spacing = {8}
				padding = {10}
			>
				<SectionHeader
					key   = "debug-title"
					value = "Debug Menu"
				/>
				<ButtonText
					id        = "btn_debug_toSpawn"
					textLabel = "toSpawn"
					cols      = {12}
					callback  = {() => {
						PlayerMover.movePlayerToSpawn()
					}}
				/>
				<ButtonText
					id        = "btn_debug_spawnFirework"
					textLabel = "spawnFirework"
					cols      = {12}
					callback  = {() => {
						FireworkLauncher.spawnParticleFirework(
							Vector3.clone(PlayerMover.spawnPosition),
						)
					}}
				/>
				<ButtonText
					id        = "btn_debug_toastScore"
					textLabel = "toast score +1"
					cols      = {12}
					callback  = {() => {
						showScoreToast(1)
					}}
				/>
				<ButtonText
					id        = "btn_debug_toastCombo"
					textLabel = "toast combo +1"
					cols      = {12}
					callback  = {() => {
						showComboToast(1)
					}}
				/>
				<ButtonText
					id        = "btn_debug_toastFuel"
					textLabel = "toast fuel +30"
					cols      = {12}
					callback  = {() => {
						showFuelToast(30)
					}}
				/>
				<ButtonText
					id        = "btn_debug_toastStrike"
					textLabel = "toast strike +1"
					cols      = {12}
					callback  = {() => {
						showStrikeToast(1)
					}}
				/>
			</Column>,
		]
	}
}

/** Present only in development builds. */
export const debugLayer = IS_DEV ? new DebugLayer() : null
