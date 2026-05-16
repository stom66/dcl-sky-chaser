import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { alpha, darken, theme } from 'src/client/ui/index'
import { C_PlayerFuel, ComponentStore } from 'src/shared/components/componentStore'

let fuelValue    = 100
let maxFuelValue = 100
let ratio        = fuelValue / maxFuelValue

ComponentStore.onComponentChange(C_PlayerFuel.PlayerFuel, (data) => {
	fuelValue    = data?.value ?? 0
	maxFuelValue = data?.maxValue ?? 100
	ratio        = Math.ceil((fuelValue / maxFuelValue) * 100)
	console.log("FuelUI: fuel value changed to", fuelValue)
})

// MARK: FuelUI
export function FuelUI() {
	return (
		<UiEntity
			key={`ui_Fuel_root`}
			uiTransform={{
				width         : '5%',
				height        : '100%',
				flexDirection : 'column',
				position      : { right: 10 },
				positionType  : 'absolute',
				justifyContent: 'center',
			}}
		>
			<UiEntity
				key={`ui_Fuel_outer`}
				uiTransform={{
					width         : 64,
					height        : 256,
					borderRadius  : 32,
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
						value    : `Fuel: ${ratio}%`,
						textAlign: 'middle-center',
					}}
				/>
			</UiEntity>
		</UiEntity>
	)
}
