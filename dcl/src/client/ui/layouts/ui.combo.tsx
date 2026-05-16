import { engine } from '@dcl/sdk/ecs'
import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui/index'
import { C_Combo, ComponentStore } from 'src/shared/components/componentStore'
import { GameSettings } from 'src/shared/settings'

let comboValue          = 0
let lastUpdatedTime     = 0
let ratio               = comboValue / GameSettings.COMBO_COOLDOWN_TIME
let cooldownTime        = GameSettings.COMBO_COOLDOWN_TIME - (Date.now() - lastUpdatedTime)

let isInitialized = false

ComponentStore.onComponentChange(C_Combo.Combo, (data) => {
	comboValue      = data?.value ?? 0
	lastUpdatedTime = data?.lastUpdatedTime ?? 0
	console.log("ComboUI: combo value changed to", comboValue)

	if (isInitialized) return
	isInitialized = true
	engine.addSystem(updateRatio)
})


function updateRatio() {
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
				width         : 192,
				height        : '100%',
				flexDirection : 'column',
				position      : { right: 32 },
				positionType  : 'absolute',
				justifyContent: 'center',
			}}
		>
			<UiEntity
				key={`ui_Combo_outer`}
				uiTransform={{
					width         : 192,
					height        : 48,
					borderRadius  : 32,
					overflow      : 'hidden',
					flexDirection : 'row',
					justifyContent: 'flex-start',
					borderColor   : darken(theme.colors.success, 0.05),
					borderWidth   : 5,
					positionType  : 'relative',
					alignItems    : 'center',
					position      : { top: -192 },
				}}

			>
				<UiEntity
					key={`ui_Combo_inner`}
					uiTransform={{
						height       : '100%',
						width      : `${100-ratio}%`,
						alignContent: 'center',
					}}
					uiBackground={{
						color: alpha(theme.colors.success, 1),
					}}
				/>
				<UiEntity
					key={`ui_Combo_inner`}
					uiTransform={{
						width       : '100%',
						height      : '48',
						alignContent: 'center',
						positionType: 'absolute',
					}}
					uiText={{
						value    : `Combo: ${comboValue}`,
						textAlign: 'middle-center',
						fontSize : 24
						
					}}
				/>
			</UiEntity>
		</UiEntity>
	)
}
