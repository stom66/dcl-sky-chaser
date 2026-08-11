import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui-old/index'
import { C_PlayerFuel, ComponentStore } from 'src/shared/components/componentStore'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { tweenValue } from '../utils/tweens'
import { EasingFunction } from '@dcl/sdk/ecs'
import { getUVsForIconAtlasNumber, getUVsForIconAtlasRow, AtlasLabelsRowIndex } from '../utils/atlas'
import { Color4 } from '@dcl/sdk/math'

let fuelValue    = 100
let maxFuelValue = 100
let ratio        = fuelValue / maxFuelValue

function getFuelValueDigits(value: number) {
	value = Math.min(value, maxFuelValue)
	return [
		Math.floor(Math.floor(value) / 10),
		Math.floor(value) % 10
	  ]
}

ComponentStore.onComponentChange(C_PlayerFuel.PlayerFuel, (data) => {
	fuelValue    = data?.value ?? 0
	maxFuelValue = data?.maxValue ?? 100
	ratio        = Math.ceil((fuelValue / maxFuelValue) * 100)
	//console.log("FuelUI: fuel value changed to", fuelValue)
})

eventBus.on(ClientEvents.GAME_ACTIVE, (data) => {
	tweenValue(elementPosition, POS_VISIBLE, 0.2, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
})
eventBus.on(ClientEvents.GAME_END, (data) => {
	tweenValue(elementPosition, POS_HIDDEN, 0.2, (v) => elementPosition = v), EasingFunction.EF_EASEOUTBACK
})

const POS_HIDDEN  = -150
const POS_VISIBLE = 10
var elementPosition     : number = POS_HIDDEN
//var elementPosition     : number = POS_VISIBLE

// MARK: FuelUI
export function FuelUI() {
	return (
		<UiEntity
			key={`ui_Fuel_root`}
			uiTransform={{
				width         : '128',
				height        : '100%',
				flexDirection : 'column',
				justifyContent: 'center',
				positionType  : 'absolute',
				position      : { right: elementPosition },
			}}
		>
			<UiEntity
				key={`ui_Fuel_outer`}
				uiTransform={{
					width         : 128,
					height        : 512,
					borderRadius  : 64,
					overflow      : 'hidden',
					flexDirection : 'column',
					justifyContent: 'flex-start',
					borderColor   : darken(theme.colors.success, 0.075),
					borderWidth   : 5,
				}}

			>
				<UiEntity
					key={`ui_Fuel_inner_fill`}
					uiTransform={{
						width         : '100%',
						height        : `${100-ratio}%`,
						alignContent  : 'center',
						flexDirection : 'column',
						alignItems    : 'center',
						flexShrink    : 0,
						justifyContent: 'center',
					}}
					uiBackground={{
						color: alpha(ratio > 66 ? theme.colors.success :  ratio > 33 ? theme.colors.warning : theme.colors.danger, 0.2),
					}}
				/>
				<UiEntity
					key={`ui_Fuel_inner_fill`}
					uiTransform={{
						width         : '100%',
						height        : 512,
						alignContent  : 'center',
						flexDirection : 'column',
						flexShrink    : 0,
						alignItems    : 'center',
						justifyContent: 'center',
					}}
					//uiText={{
					//	fontSize : 32,
					//	value    : `Fuel: ${ratio}%`,
					//	textAlign: 'middle-center',
					//}}
					uiBackground={{
						//color: theme.colors.success,
						texture: { src: "assets/images/ui/bg-fuel.png" },
						textureMode: 'stretch',
					}}
				/>
				<UiEntity
					key={`ui_Fuel_inner_labels`}
					uiTransform={{
						width       : 256,
						height      : 128,
						flexGrow    : 0,
						flexShrink  : 0,
						positionType: 'absolute',
						position: { top: 256-64, left: -64 },
						flexDirection: 'column',
						alignItems    : 'center',
						alignContent  : 'center',
						alignSelf     : 'center',

					}}
					uiBackground={{
						//color      : Color4.White(),
					}}
				>
	
					<UiEntity
						key={`ui_Fuel_inner_label_fuel`}
						uiTransform={{
							width       : 256,
							height      : 64,
							flexGrow    : 0,
							flexShrink  : 0,
							alignSelf   : 'center',
						}}
						uiBackground={{
							texture    : { src: "assets/images/ui/atlas-gui-labels.png" },
							textureMode: 'stretch',
							uvs        : getUVsForIconAtlasRow(AtlasLabelsRowIndex.FUEL),
						}}
					/>
					
					<UiEntity
						key={`ui_Fuel_inner_label_fuelAmount`}
						uiTransform={{
							width         : 128,
							height        : 64,
							flexGrow      : 0,
							flexShrink    : 0,
							flexDirection : 'row',
							justifyContent: 'center',
							alignContent  : 'center',
							alignItems    : 'center',
						}}
					>
						<UiEntity
							key={`ui_Fuel_inner_label_fuelAmount_10s`}
							uiTransform={{
								width       : 32,
								height      : 64,
							}}
							uiBackground={{
								texture    : { src: "assets/images/ui/atlas-numbers-fuel.png" },
								textureMode: 'stretch',
								uvs        : getUVsForIconAtlasNumber(getFuelValueDigits(fuelValue)[0]),
							}}
						/>
						<UiEntity
							key={`ui_Fuel_inner_label_fuelAmount_1s`}
							uiTransform={{
								width       : 32,
								height      : 64,
							}}
							uiBackground={{
								texture    : { src: "assets/images/ui/atlas-numbers-fuel.png" },
								textureMode: 'stretch',
								uvs        : getUVsForIconAtlasNumber(getFuelValueDigits(fuelValue)[1]),
							}}
						/>
						<UiEntity
							key={`ui_Fuel_inner_label_fuelAmount_pc`}
							uiTransform={{
								width       : 32,
								height      : 64,
							}}
							uiBackground={{
								texture    : { src: "assets/images/ui/atlas-numbers-fuel.png" },
								textureMode: 'stretch',
								uvs        : getUVsForIconAtlasNumber(14),
							}}
						/>
					</UiEntity>
				</UiEntity>
			</UiEntity>
		</UiEntity>
	)
}
