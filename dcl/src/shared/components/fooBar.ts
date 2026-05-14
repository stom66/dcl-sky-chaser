import { engine, Schemas } from "@dcl/sdk/ecs"

export const FooBar = engine.defineComponent(
	'FooBar',
	{
		foo: Schemas.String,
		bar: Schemas.Int,
	}
)
