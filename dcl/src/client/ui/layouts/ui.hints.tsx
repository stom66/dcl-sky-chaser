import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { tweenValue } from '../utils/tweens'
import { EasingFunction, engine } from '@dcl/sdk/ecs'
import { getUVsForIconAtlasRow } from '../utils/atlas'
import * as utils from '@dcl-sdk/utils'

let currentHintIndex     = 0
let isVisible            = false
let isEnabled            = false
let lastHitnShowTime     = 0

const TIME_BETWEEN_HINTS = 1000 * 30 // ms
const TIME_TO_SHOW_HINT = 1000 * 5 // ms
const MAX_HINTS_IN_ATLAS = 10

const SHOW_HINTS_AGAIN_AFTER = 1000 * 60 * 5 // 5 minutes

const UI_ANIMATION_DURATION = 0.4 // seconds

export function EnableHints() {
	if (isEnabled) return

	isEnabled        = true
	currentHintIndex = MAX_HINTS_IN_ATLAS - 1
	ShowUI()
	engine.addSystem(sys_UpdateHints)
}

export function DisableHints() {
	if (!isEnabled) return

	isEnabled = false
	engine.removeSystem(sys_UpdateHints)
	HideUI()
}

function sys_UpdateHints() {
	if (Date.now() - lastHitnShowTime > TIME_TO_SHOW_HINT) {
		if (isVisible) {
			HideUI()
		}
	}
	if (Date.now() - lastHitnShowTime > TIME_BETWEEN_HINTS) {
		lastHitnShowTime = Date.now()
		
		currentHintIndex--
		if (currentHintIndex < 0) {
			setTimeout(() => {
				EnableHints()
			}, SHOW_HINTS_AGAIN_AFTER) // 5 minutes
			DisableHints()
		}
			// break the loop
			

		if (isVisible) {
			HideUI()
		} 
		
		utils.timers.setTimeout(() => {
			ShowUI()
		}, UI_ANIMATION_DURATION * 1000)
	}
}


function ShowUI() {
	if (isVisible) return

	isVisible = true
	tweenValue(elementPosition, POS_DEFAULT, UI_ANIMATION_DURATION, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
}

function HideUI() {
	if (!isVisible) return
	isVisible = false
	tweenValue(elementPosition, POS_HIDDEN, UI_ANIMATION_DURATION, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
}

const HINT_WIDTH = 512
const HINT_HEIGHT = 104

const POS_DEFAULT    = (1920 / 2) - (HINT_WIDTH / 2)
const POS_HIDDEN     = -HINT_WIDTH-64

var elementPosition: number   = POS_HIDDEN

enum ButtonIndex {
	DEFAULT  = 3,
	HOVER    = 2,
	PRESS    = 1,
	DISABLED = 0,
}

let buttonIndex: ButtonIndex = ButtonIndex.DEFAULT


// MARK: FuelUI
export function HintsUI() {
	return (
		<UiEntity
			key={`ui_Hints_root`}
			uiTransform={{
				width         : HINT_WIDTH,
				height        : HINT_HEIGHT,
				flexDirection : 'column',
				position      : { right: elementPosition, bottom: 144 },
				positionType  : 'absolute',
				justifyContent: 'center',
			}}
		>
			<UiEntity
				key={`ui_Hints_closeButton`}
				uiTransform={{
					width         : '64',
					height        : '64',
					overflow      : 'hidden',
					positionType  : 'absolute',
					position      : { top: 20, left: -24 },
				}}

				uiBackground={{
					texture    : { src: "assets/images/ui/atlas-btn-close.png" },
					textureMode: 'stretch',
					uvs        : getUVsForIconAtlasRow(buttonIndex, 4),
				}}

				onMouseEnter = {() => buttonIndex = ButtonIndex.HOVER}
				onMouseLeave = {() => { if (buttonIndex === ButtonIndex.HOVER) buttonIndex = ButtonIndex.DEFAULT }}
				onMouseDown  = {() => {buttonIndex = ButtonIndex.PRESS; HideUI()}}
				onMouseUp    = {() => { if (buttonIndex === ButtonIndex.PRESS) buttonIndex = ButtonIndex.DEFAULT }}
			/>
			<UiEntity
				key={`ui_Hints_image`}
				uiTransform={{
					width         : '100%',
					height        : '100%',
					overflow      : 'hidden',
				}}
				onMouseDown  = {() => {buttonIndex = ButtonIndex.PRESS; HideUI()}}

				uiBackground={{
					texture    : { src: "assets/images/ui/atlas-hints.png" },
					textureMode: 'stretch',
					uvs        : getUVsForIconAtlasRow(currentHintIndex, MAX_HINTS_IN_ATLAS),
				}}
			/>
				
		</UiEntity>
	)
}
