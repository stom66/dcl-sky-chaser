import { engine, Schemas } from "@dcl/sdk/ecs"

import { GameStatus } from "src/shared/enums"


export const GameData = engine.defineComponent(
	'GameData',
	{
		status   : Schemas.EnumString<GameStatus>(GameStatus, GameStatus.LOBBY),
		startTime: Schemas.Int64,
		players  : Schemas.Optional(
			Schemas.Array(Schemas.String)
		)
	}
)

export const ScoreBoard = engine.defineComponent(
	'ScoreBoard',
	{
		scores: Schemas.Optional(
			Schemas.Array(Schemas.Map({
				userId: Schemas.String,
				score: Schemas.Int,
			}))
		)
	}
)
