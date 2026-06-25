import { engine, Schemas } from "@dcl/sdk/ecs"

export const ProjectileComponent = engine.defineComponent(
	'ProjectileComponent',
	{
		owner: Schemas.String
	}
)
