import { engine, Schemas } from "@dcl/sdk/ecs"

export const PlayerFuel = engine.defineComponent(
	'PlayerFuel',
	{
		value: Schemas.Int,
		maxValue: Schemas.Int,
	}
)
