export type PlayerStatsRecord = Record<PlayerStatsEnum, number>

export enum PlayerStatsEnum {
	GAMES_CREATED         = "gamesCreated",
	GAMES_PLAYED          = "gamesPlayed",
	GAMES_WON             = "gamesWon",

	COLLECTED_POINTS      = "collectedPoints",
	COLLECTED_BALLOONS    = "collectedBalloons",
	COLLECTED_FUEL        = "collectedFuel",
	TRIGGERED_SPEEDRINGS  = "collectedSpeedRing",
	TRIGGERED_TRAMPOLINES = "triggeredTrampoline",
	TRIGGERED_AWNING      = "triggeredAwning",
	TRIGGERED_UMBRELLAS   = "triggeredUmbrellas",

	FOUND_ALL_PIGEONS     = "foundAllPigeons",
}
