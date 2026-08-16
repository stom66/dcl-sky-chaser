import { Color4 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs, { PositionUnit } from '@dcl/sdk/react-ecs'
import {
	ButtonImage,
	Icon,
	Layer,
	Pulse,
	sizeValueToPixels,
	UiBox,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { ClientMessaging } from 'src/client/clientMessaging'
import { btnWideAtlas, guiLabelsAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { C_GameData, C_SpectatorMode, ComponentStore } from 'src/shared/components/componentStore'
import { GameStatus } from 'src/shared/enums'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


/** `btn-wide` frames are 512×128 (4 rows in a 512² sheet) — keep 4:1 on screen. */
const BUTTON_WIDTH_BASE = isMobile() ? 35 : 25
const BUTTON_WIDTH  = `${BUTTON_WIDTH_BASE}vw` as PositionUnit
const BUTTON_HEIGHT = `${BUTTON_WIDTH_BASE/4}vw` as PositionUnit

/**
 * "Start Game" label — native strip is 512×128 (4:1), same as each btn-wide row.
 * Centered via a full-bleed flex host (not absolute px) so hover scale keeps it middle.
 */
const LABEL_WIDTH  = `${BUTTON_WIDTH_BASE*0.6}vw` as PositionUnit
const LABEL_HEIGHT = `${BUTTON_WIDTH_BASE*0.15}vw` as PositionUnit


// MARK: StartButtonLayer
/**
 * BottomCenter start-game control. Visible while idle; requests a new game on click.
 * `btn-wide.png` is the 4-row state atlas; "Start Game" label sits centered on top.
 */
export class StartButtonLayer extends Layer {
	constructor() {
		super({
			id         : 'skyChaser-startButton',
			zone       : ZoneType.BottomCenter,
			canBeHidden: true,
			startHidden: false,
			uiTransform: {
				// Full-bleed bottom strip so justifyContent can truly center the button.
				// (Preset 50%-wide + left/right + absolute ButtonImage defaults looked left-biased.)
				width         : '100%',
				height        : BUTTON_HEIGHT,
				position      : { bottom: 8, left: 0, right: 0 },
				justifyContent: 'center',
				alignItems    : 'flex-end',
				flexDirection : 'row',
			},
		})

		eventBus.on(ClientEvents.GAME_IDLE, () => {
			this.show()
		})
		eventBus.on(ClientEvents.GAME_STARTING, () => {
			this.hide()
		})
		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			this.hide()
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			this.hide()
		})

		ComponentStore.onComponentChange(C_GameData.GameData, () => {
			this.syncVisibilityToGameStatus()
		})
		ComponentStore.onComponentChange(C_SpectatorMode.SpectatorMode, () => {
			this.syncVisibilityToGameStatus()
		})

		this.syncVisibilityToGameStatus()
	}


	// MARK: syncVisibilityToGameStatus
	/** Shows only while idle and not spectating. */
	private syncVisibilityToGameStatus() {
		if (ComponentStore.getSpectatorModeEnabled()) {
			this.hide()
			return
		}
		if (ComponentStore.getGameStatus() === GameStatus.IDLE) {
			this.show()
		} else {
			this.hide()
		}
	}


	// MARK: body
	protected body() {
		// Pulse needs numeric sizes (rejects `vw`); resolve against the virtual canvas at render.
		const buttonWidth  = sizeValueToPixels(BUTTON_WIDTH)  ?? 420
		const buttonHeight = sizeValueToPixels(BUTTON_HEIGHT) ?? 105
		const labelWidth   = sizeValueToPixels(LABEL_WIDTH)   ?? 320
		const labelHeight  = sizeValueToPixels(LABEL_HEIGHT)  ?? 80

		return [
			<Pulse
				key           = "start-button-pulse"
				id            = "pulse_startGame"
				scaleMin      = {1}
				scaleMax      = {1.15}
				burstCount    = {2}
				burstInterval = {2}
				uiTransform   = {{
					positionType: 'relative',
					position    : { top: 0, left: 0 },
				}}
			>
				<ButtonImage
					key      = "start-button"
					id       = "btn_startGame"
					atlas    = {btnWideAtlas}
					uvColumn = {1}
					width    = {buttonWidth}
					height   = {buttonHeight}
					// ButtonImage defaults to absolute { top: 20, left: -24 } — override so
					// the zone’s flex centering owns placement.
					uiTransform = {{
						positionType: 'relative',
						position    : { top: 0, left: 0 },
					}}
					callback = {() => {
						if (ComponentStore.getGameStatus() !== GameStatus.IDLE) return
						ClientMessaging.RequestNewGame()
					}}
				>
					{/* Fill the scaled button chrome; flex-center so hover resize doesn't drift the label. */}
					<UiBox
						key            = "start-button-label-host"
						positionType   = "absolute"
						position       = {{ top: 0, right: 0, bottom: 0, left: 0 }}
						alignItems     = "center"
						justifyContent = "center"
					>
						<Icon
							key       = "start-button-label"
							src       = {guiLabelsAtlas.source}
							uvs       = {guiLabelsAtlas.uv.startGame}
							width     = {labelWidth}
							height    = {labelHeight}
							iconColor = {Color4.White()}
						/>
					</UiBox>
				</ButtonImage>
			</Pulse>,
		]
	}
}

export const startButtonLayer = new StartButtonLayer()
