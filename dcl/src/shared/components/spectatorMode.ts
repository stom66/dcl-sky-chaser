import { engine, Schemas } from "@dcl/sdk/ecs"

export const SpectatorMode = engine.defineComponent(
	'SpectatorMode',
	{
		enabled: Schemas.Boolean,
	}
)
