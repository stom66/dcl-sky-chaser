import { engine, Schemas } from "@dcl/sdk/ecs"

export const BalloonPickup = engine.defineComponent(
	'BalloonPickup',
	{
		value: Schemas.Int,
		riseSpeed: Schemas.Int,
		spinSpeed: Schemas.Int,
	}
)
