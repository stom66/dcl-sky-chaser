import { engine, Schemas } from "@dcl/sdk/ecs"

export const FuelPickup = engine.defineComponent(
	'FuelPickup',
	{
		amount: Schemas.Int,
	}
)
