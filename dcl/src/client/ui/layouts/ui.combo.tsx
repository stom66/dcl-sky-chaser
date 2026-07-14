import { EasingFunction, engine } from '@dcl/sdk/ecs'
import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui/index'
import { C_Combo, ComponentStore } from 'src/shared/components/componentStore'
import { GameSettings } from 'src/shared/settings'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { tweenValue } from '../utils/tweens'
import { getUVsForIconAtlasNumber, getUVsForIconAtlasRow, AtlasLabelsRowIndex } from '../utils/atlas'

let comboValue          = 0
let lastUpdatedTime     = 0
let ratio               = comboValue / GameSettings.COMBO_COOLDOWN_TIME
let cooldownTime        = GameSettings.COMBO_COOLDOWN_TIME - (Date.now() - lastUpdatedTime)

let isInitialized = false

eventBus.on(ClientEvents.GAME_ACTIVE, (data) => {
	tweenValue(elementPosition, POS_VISIBLE, 0.2, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
})
eventBus.on(ClientEvents.GAME_END, (data) => {
	tweenValue(elementPosition, POS_HIDDEN, 0.2, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
})

const POS_HIDDEN  = -256
const POS_VISIBLE = 0
var elementPosition: number = POS_HIDDEN
//var elementPosition: number = POS_VISIBLE

const SCALE = 1.25

ComponentStore.onComponentChange(C_Combo.Combo, (data) => {
	comboValue      = data?.value ?? 0
	lastUpdatedTime = data?.lastUpdatedTime ?? 0
	console.log("ComboUI: combo value changed to", comboValue)

	if (isInitialized) return
	isInitialized = true
	engine.addSystem(sys_updateRatio)
})


function sys_updateRatio() {
	if (comboValue == 1) {
		ratio = 0
		return
	}
	const timeSinceLastUpdated = Date.now() - lastUpdatedTime
	ratio        = Math.ceil((timeSinceLastUpdated / GameSettings.COMBO_COOLDOWN_TIME) * 100)
	ratio        = Math.max(0, Math.min(ratio, 100))
	//console.log("ComboUI: timeSinceLastUpdated", timeSinceLastUpdated, "ratio", ratio)
	//console.log("ComboUI: ratio changed to", ratio)
}

// MARK: ComboUI
export function ComboUI() {
	return (
		<UiEntity
			key={`ui_Combo_root`}
			uiTransform={{
				width         : "100%",
				height        : 128,
				flexDirection : 'row',
				justifyContent: 'center',
				alignContent  : 'center',
				alignItems    : 'center',
				positionType  : 'absolute',
				position      : { right: 0, top: 0 },
			}}
		>
			<UiEntity
				key={`ui_Combo_outer`}
				uiTransform={{
					width         : 420*SCALE,
					height        : 90*SCALE,
					borderRadius  : 45*SCALE,
					overflow      : 'hidden',
					flexDirection : 'row',
					justifyContent: 'flex-start',
					borderColor   : darken(theme.colors.primary, 0.05),
					borderWidth   : 5,
					alignItems    : 'center',
					positionType  : 'relative',
					position      : { top: elementPosition },
				}}

			>
				<UiEntity
					key={`ui_Combo_inner_fill`}
					uiTransform={{
						height       : '100%',
						width      : `${100-ratio}%`,
						alignContent: 'center',
					}}
					uiBackground={{
						color: alpha(theme.colors.primary, 1),
					}}
				/>
				<UiEntity
					key={`ui_Combo_inner`}
					uiTransform={{
						width       : '100%',
						height      : '100%',
						alignContent: 'center',
						positionType: 'absolute',
						alignSelf: 'center',
						flexDirection: 'row',
					}}
				>
					<UiEntity
						key={`ui_Combo_inner_image`}
						uiTransform={{
							width       : 336*SCALE,
							height      : 84*SCALE,
						}}
						uiBackground={{
							texture    : { src: "assets/images/ui/atlas-gui-labels.png" },
							textureMode: 'stretch',
							uvs        : getUVsForIconAtlasRow(AtlasLabelsRowIndex.COMBO),
						}}
					/>
					<UiEntity
						key={`ui_Combo_inner_text`}
						uiTransform={{
							width       : 42*SCALE,
							height      : 84*SCALE,
							alignContent: 'center',
						}}
						uiBackground={{
							texture    : { src: "assets/images/ui/atlas-numbers-default.png" },
							textureMode: 'stretch',
							uvs        : getUVsForIconAtlasNumber(comboValue),
						}}
						//uiText={{
						//	value    : `${comboValue}`,
						//	textAlign: 'middle-center',
						//	fontSize : 48
						//	
						//}}
					/>
				</UiEntity>
			</UiEntity>
		</UiEntity>
	)
}
