import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { tweenValue } from '../utils/tweens'
import { EasingFunction, engine } from '@dcl/sdk/ecs'
import { getUVsForIconAtlasRow } from '../utils/atlas'
import * as utils from '@dcl-sdk/utils'
import { vwAsPixels } from '../utils/sizing'
import { ButtonImageClose } from '../components'
import { Color4 } from '@dcl/sdk/math'

let currentHintIndex     = 0
let isVisible            = false
let isEnabled            = false
let lastHitnShowTime     = 0

const TIME_BETWEEN_HINTS = 1000 * 30 // ms
const TIME_TO_SHOW_HINT = 1000 * 7.5 // ms
const MAX_HINTS_IN_ATLAS = 10

const SHOW_HINTS_AGAIN_AFTER = 1000 * 60 * 5 // 5 minutes

const UI_ANIMATION_DURATION = 0.4 // seconds

export function EnableHints() {
	if (isEnabled) return

	isEnabled        = true
	currentHintIndex = MAX_HINTS_IN_ATLAS // not -1, because the system will decrement it
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
			return
		}

		if (isVisible) HideUI()
		
		// Show the hint, after a short delay to give an exisitng hint time to get out the way
		utils.timers.setTimeout(() => {
			ShowUI()
		}, UI_ANIMATION_DURATION * 1000 * 2)
	}
}


function ShowUI() {
	if (isVisible) return

	console.log("ShowHint: currentHintIndex", currentHintIndex)
	isVisible = true
	tweenValue(elementPosition, POS_DEFAULT, UI_ANIMATION_DURATION, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
}

function HideUI() {
	if (!isVisible) return
	isVisible = false
	tweenValue(elementPosition, POS_HIDDEN, UI_ANIMATION_DURATION, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
}

const HINT_WIDTH  = 512
const HINT_HEIGHT = 104

const POS_DEFAULT = 0
const POS_HIDDEN  = -1920

var elementPosition: number = POS_HIDDEN

enum ButtonIndex {
	DEFAULT  = 3,
	HOVER    = 2,
	PRESS    = 1,
	DISABLED = 0,
}

let buttonIndex: ButtonIndex = ButtonIndex.DEFAULT


// MARK: HintsUI
export function HintsUI() {
	return (
		<UiEntity
			key={`ui_Hints_root`}
			uiTransform={{
				width         : '100%',
				height        : '100%',
				flexDirection : 'column',
				justifyContent: 'flex-end',
				alignItems    : 'center',
				flexShrink    : 0,
				padding       : { bottom: 144 },
				positionType  : 'absolute',
				position      : { right: 0, top: 0 },
			}}
		>
			<UiEntity
				key={`ui_Hints_image`}
				uiTransform={{
					width         : HINT_WIDTH,
					height        : HINT_HEIGHT,
					positionType  : 'relative',
					position      : { right: elementPosition },
				}}
				onMouseDown = {() => {buttonIndex = ButtonIndex.PRESS; HideUI()}}

				uiBackground={{
					texture    : { src: "assets/images/ui/atlas-hints.png" },
					textureMode: 'stretch',
					uvs        : getUVsForIconAtlasRow(currentHintIndex, MAX_HINTS_IN_ATLAS),
				}}
			>
				<ButtonImageClose
					id          = "ui_hints_close"
					callback    = {HideUI}
					uiTransform = {{
						width   : '64',
						height  : '64',
						position: { top: '24', left: '-24' },
					}}
				/>
			</UiEntity>
		</UiEntity>
	)
}
