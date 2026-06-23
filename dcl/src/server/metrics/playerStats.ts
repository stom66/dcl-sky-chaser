export type PlayerStatsRecord = Record<PlayerStats, number>

export enum PlayerStats {
	GAMES_CREATED       = "gamesCreated",
	GAMES_PLAYED        = "gamesPlayed",
	GAMES_WON           = "gamesWon",
	GAMES_LEFT_EARLY    = "gamesLeftEarly",

	// CUSTOM_STAT = "customStat"
	COLLECTED_POINTS      = "collectedPoints",
	COLLECTED_BALLOONS    = "collectedBalloons",
	COLLECTED_FUEL        = "collectedFuel",
	TRIGGERED_SPEEDRINGS  = "collectedSpeedRing",
	TRIGGERED_TRAMPOLINES = "triggeredTrampoline",
	TRIGGERED_AWNING      = "triggeredTrampoline",
	TRIGGERED_UMBRELLAS   = "triggeredUmbrellas",
}
