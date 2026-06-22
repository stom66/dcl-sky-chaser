import { engine, Schemas } from "@dcl/sdk/ecs"

// MARK: Component Schema
const leaderboardSchema = {
	scores: Schemas.Array(Schemas.Map({
		userId     : Schemas.String,
		displayName: Schemas.String,
		score      : Schemas.Int,
		rank       : Schemas.Int
	}))
}

export const leaderboardAllTime = engine.defineComponent(
	'leaderboardAllTime', leaderboardSchema
)

export const leaderboardWeekly = engine.defineComponent(
	'leaderboardWeekly', leaderboardSchema
)
