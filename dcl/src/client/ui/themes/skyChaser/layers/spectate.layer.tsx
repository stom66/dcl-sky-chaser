import { Color4 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'
import { getPlayer } from '@dcl/sdk/players'
import ReactEcs, { PositionUnit } from '@dcl/sdk/react-ecs'
import {
	Background,
	ButtonImage,
	Column,
	getTheme,
	getUVCell,
	getUVRow,
	Icon,
	Layer,
	Row,
	sizeValueToPixels,
	Text,
	UiBox,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { ComponentStore } from 'src/shared/components/componentStore'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'

import { SpectateMode } from 'src/client/spectate-mode'
import { SM_PlayerRoster } from 'src/client/spectate-mode/playerRoster'
import { btnWideAtlas, guiLabelsAtlas } from 'src/client/ui/themes/skyChaser/atlases'


/** `btn-wide` frames are 512×128 (4 rows in a 512² sheet) — keep 4:1 on screen. */
const BUTTON_WIDTH_BASE = isMobile() ? 35 : 25
const BUTTON_WIDTH  = `${BUTTON_WIDTH_BASE}vw` as PositionUnit
const BUTTON_HEIGHT = `${BUTTON_WIDTH_BASE / 4}vw` as PositionUnit

const LABEL_WIDTH  = `${BUTTON_WIDTH_BASE * 0.6}vw` as PositionUnit
const LABEL_HEIGHT = `${BUTTON_WIDTH_BASE * 0.15}vw` as PositionUnit

/** Placeholder strip — drop `spectate-controls.png` in when the art is ready. */
//const CONTROLS_WIDTH  = isMobile() ? 70 : 50
const CONTROLS_WIDTH  = 512
const CONTROLS_HEIGHT = CONTROLS_WIDTH * 0.5 * (3/5)

const CONTROLS_SRC_PLAYER  = 'assets/images/ui/spectate-bg.png'
const CONTROLS_SRC_DEFAULT = 'assets/images/ui/spectate-bg-raise.png'


// MARK: getCurrentTargetLabel
/**
 * Follow-target copy for the controls strip: player display name, or "none".
 */
function getCurrentTargetLabel(): string {
	const userId = SM_PlayerRoster.getCurrentPlayerUserId()
	if (!userId) return 'None'

	const name = getPlayer({ userId: userId.toLowerCase() })?.name?.trim()
	return `${name || userId}`
}

function getBackgroundImage(): string {
	const userId = SM_PlayerRoster.getCurrentPlayerUserId()
	if (!userId) return CONTROLS_SRC_DEFAULT

	return CONTROLS_SRC_PLAYER
}

// MARK: SpectateLayer
/**
 * Bottom spectate HUD: exit button (btn-wide + GUI Labels row 8) above a
 * controls strip with current follow-target text. Shown only while spectating.
 */
export class SpectateLayer extends Layer {
	constructor() {
		super({
			id         : 'skyChaser-spectate',
			zone       : ZoneType.BottomCenter,
			canBeHidden: true,
			startHidden: true,
			uiTransform: {
				height        : 'auto',
				flexDirection : 'column',
				justifyContent: 'flex-end',
				alignItems    : 'center',
			},
		})

		eventBus.on(ClientEvents.SPECTATE_ENABLED, () => {
			this.show()
		})
		eventBus.on(ClientEvents.SPECTATE_DISABLED, () => {
			this.hide()
		})
	}


	// MARK: body
	protected body() {
		const theme        = getTheme()
		const buttonWidth  = sizeValueToPixels(BUTTON_WIDTH)  ?? 420
		const buttonHeight = sizeValueToPixels(BUTTON_HEIGHT) ?? 105
		const labelWidth   = sizeValueToPixels(LABEL_WIDTH)   ?? 320
		const labelHeight  = sizeValueToPixels(LABEL_HEIGHT)  ?? 80
		const targetLabel  = getCurrentTargetLabel()

		return [
			<Column
				key            = "spectate-controls"
				width          = {`${CONTROLS_WIDTH}`}
				height         = {`${CONTROLS_HEIGHT}`}
				alignItems     = "center"
				alignContent   = 'center'
				justifyContent = "flex-end"
				padding        = {{ bottom: 8 }}
				uiTransform={{
					alignItems    : 'center',
					justifyContent: 'center',
				}}
			>
				<Background
					key             = "spectate-controls-bg"
					textureSrc      = {getBackgroundImage()}
					backgroundColor = {Color4.White()}
					borderWidth     = {0}
					borderRadius    = {0}
					uiBackground    = {{
						textureMode: 'stretch',
						uvs        : getUVCell({
							xStart: 1, 
							xTotal: 1, 
							yStart: 2, 
							yEnd  : 4,
							yTotal: 5
						})
					}}
				/>
				<Row>
					<Column cols={6} />
					<Column cols={6}>
						<Text
							key       = "spectate-target"
							value     = {targetLabel}
							fontSize  = {theme.typography.size.default}
							fontColor = {theme.colors.light}
							textAlign = "middle-left"
							textWrap  = "nowrap"
							uiTransform={{
								margin: { bottom: 25 },
							}}
						/>
					</Column>
					
				</Row>
			</Column>,
			<ButtonImage
				key      = "spectate-exit-button"
				id       = "btn_exitSpectate"
				atlas    = {btnWideAtlas}
				uvColumn = {1}
				width    = {buttonWidth}
				height   = {buttonHeight}
				uiTransform = {{
					positionType: 'relative',
					position    : { top: 0, left: 0 },
				}}
				callback = {() => {
					if (!ComponentStore.getSpectatorModeEnabled()) return
					SpectateMode.toggleSpectateMode()
				}}
			>
				<UiBox
					key            = "spectate-exit-label-host"
					positionType   = "absolute"
					position       = {{ top: 0, right: 0, bottom: 0, left: 0 }}
					alignItems     = "center"
					justifyContent = "center"
				>
					<Icon
						key       = "spectate-exit-label"
						src       = {guiLabelsAtlas.source}
						uvs       = {guiLabelsAtlas.uv.exitSpectate}
						width     = {labelWidth}
						height    = {labelHeight}
						iconColor = {Color4.White()}
					/>
				</UiBox>
			</ButtonImage>,
		]
	}
}

export const spectateLayer = new SpectateLayer()
