import { engine, Schemas } from "@dcl/sdk/ecs"

export const Combo = engine.defineComponent(
	'Combo',
	{
		value: Schemas.Int,
		lastUpdatedTime: Schemas.Int64,
	}
)
