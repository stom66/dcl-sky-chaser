import { engine, Schemas } from "@dcl/sdk/ecs"

export const PigeonCounter = engine.defineComponent(
	'PigeonCounter',
	{
		status  : Schemas.Array(Schemas.Boolean),
		count   : Schemas.Int,
		maxCount: Schemas.Int,
	}
)
