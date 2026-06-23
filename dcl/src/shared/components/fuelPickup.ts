import { engine, Schemas } from "@dcl/sdk/ecs"

export const FuelPickupComponent = engine.defineComponent(
	'FuelPickup',
	{
		amount: Schemas.Int,
	}
)

export const FuelPickupChildComponent = engine.defineComponent(
	'FuelPickupChild', {}
)
