import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui/index'
import { C_PigeonCounter, ComponentStore } from 'src/shared/components/componentStore'
import { tweenValue } from '../utils/tweens'
import { EasingFunction, engine, Transform } from '@dcl/sdk/ecs'
import { getUVsForIconAtlasNumber, getUVsForIconAtlasRow, AtlasRowIndex_Icons } from '../utils/atlas'
import * as utils from '@dcl-sdk/utils'
import { vwAsPixels } from '../utils/sizing'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { sfx, SoundManager } from 'src/client/soundManager'
import { ParticleSpawner } from 'src/client/particleSpawner'
import { Vector3 } from '@dcl/sdk/math'


let count    = 0

ComponentStore.onComponentChange(C_PigeonCounter.PigeonCounter, (data) => {
	const newCount = data?.count ?? 0
	console.log("PigeonCounterUI count changed: newCount", newCount)
	if (newCount > count) {
		count = newCount
		ShowUI()

		//utils.timers.setTimeout(() => {
		//	HideUI()
		//}, 2500)
		console.log("PigeonCounterUI: count changed to", count)
	}
	if (newCount === 0) {
		HideUI()
	}
})

eventBus.on(ClientEvents.FOUND_ALL_PIGEONS, (data) => {
	HideUI()
})


function ShowUI() {
	tweenValue(elementPositionTop, POS_DEFAULT, 0.4, (v) => elementPositionTop = v), EasingFunction.EF_EASEOUTBACK
}

function HideUI() {
	tweenValue(elementPositionTop, POS_HIDDEN, 0.4, (v) => elementPositionTop = v), EasingFunction.EF_EASEOUTBACK
}

const POS_DEFAULT    = vwAsPixels(20)
const POS_HIDDEN     = -310

var elementPositionTop: number   = POS_HIDDEN

// MARK: FuelUI
export function PigeonCounterUI() {
	return (
		<UiEntity
			key={`ui_PigeonCounter_root`}
			uiTransform={{
				width         : '256',
				height        : '128',
				flexDirection : 'column',
				position      : { right: elementPositionTop, bottom: 10 },
				positionType  : 'absolute',
				justifyContent: 'center',
			}}
			uiBackground={{
				texture: { src: "assets/images/ui/bg-counter.png" },
				textureMode: 'stretch',
			}}
		>
			<UiEntity
				key={`ui_PigeonCounter_inner_count`}
				uiTransform={{
					width         : 31,
					height        : 64,
					borderRadius  : 64,
					overflow      : 'hidden',
					positionType  : 'absolute',
					position      : { top:44, left: 26 },
				}}

				uiBackground={{
					texture    : { src: "assets/images/ui/atlas-numbers-default.png" },
					textureMode: 'stretch',
					uvs        : getUVsForIconAtlasNumber(count),
				}}
			/>
				
		</UiEntity>
	)
}
