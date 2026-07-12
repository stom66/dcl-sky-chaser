import { engine, Schemas } from "@dcl/sdk/ecs"

import { PlayerStatsEnum } from "src/shared/metrics/playerStats"

const PlayerStatsEnumSchema = {
	...Object.fromEntries(Object.values(PlayerStatsEnum).map(stat => [stat, Schemas.Number])),
}

export const PlayerStatsIdentity = engine.defineComponent(
	'PlayerStatsIdentity', {
		userId: Schemas.String,
	}
)

export const PlayerStatsPerGame = engine.defineComponent(
	'PlayerStatsPerGame', PlayerStatsEnumSchema
)

export const PlayerStatsPerSession = engine.defineComponent(
	'PlayerStatsPerSession', PlayerStatsEnumSchema
)

export const PlayerStatsAllTime = engine.defineComponent(
	'PlayerStatsAllTime', PlayerStatsEnumSchema
)
