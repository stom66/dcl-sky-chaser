import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui/index'
import { C_PlayerFuel, ComponentStore } from 'src/shared/components/componentStore'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { tweenValue } from '../utils/tweens'
import { EasingFunction } from '@dcl/sdk/ecs'

let fuelValue    = 100
let maxFuelValue = 100
let ratio        = fuelValue / maxFuelValue

ComponentStore.onComponentChange(C_PlayerFuel.PlayerFuel, (data) => {
	fuelValue    = data?.value ?? 0
	maxFuelValue = data?.maxValue ?? 100
	ratio        = Math.ceil((fuelValue / maxFuelValue) * 100)
	console.log("FuelUI: fuel value changed to", fuelValue)
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


// MARK: FuelUI
export function FuelUI() {
	return (
		<UiEntity
			key={`ui_Fuel_root`}
			uiTransform={{
				width         : '128',
				height        : '100%',
				flexDirection : 'column',
				position      : { right: elementPosition },
				positionType  : 'absolute',
				justifyContent: 'center',
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
					justifyContent: 'flex-end',
					borderColor   : darken(theme.colors.success, 0.05),
					borderWidth   : 5,
				}}

			>
				<UiEntity
					key={`ui_Fuel_inner`}
					uiTransform={{
						width       : '100%',
						height      : `${ratio}%`,
						alignContent: 'center',
					}}
					uiBackground={{
						color: alpha(theme.colors.success, 1),
					}}
					uiText={{
						fontSize : 32,
						value    : `Fuel: ${ratio}%`,
						textAlign: 'middle-center',
					}}
				/>
			</UiEntity>
		</UiEntity>
	)
}
