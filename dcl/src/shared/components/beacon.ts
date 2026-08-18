import { engine, Schemas } from "@dcl/sdk/ecs"

export const BeaconComponent = engine.defineComponent(
	'Beacon',
	{
		userId: Schemas.String,
	}
)

export const BeaconArrowComponent = engine.defineComponent(
	'BeaconArrow',
	{
		userId   : Schemas.String,
		direction: Schemas.Number,
	}
)
