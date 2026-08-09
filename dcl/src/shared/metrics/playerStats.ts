export type PlayerStatsRecord = Record<PlayerStatsEnum, number>

export enum PlayerStatsEnum {
	GAMES_CREATED                       = "gamesCreated",
	GAMES_PLAYED                        = "gamesPlayed",
	GAMES_WON                           = "gamesWon",

	COLLECTED_POINTS                    = "collectedPoints",
	COLLECTED_BALLOONS                  = "collectedBalloons",
	COLLECTED_FUEL_AMOUNT               = "collectedFuelAmount",
	COLLECTED_FUEL_PICKUPS              = "collectedFuelPickups",

	TRIGGERED_SPEED_RINGS               = "triggeredSpeedRings",
	TRIGGERED_TRAMPOLINES               = "triggeredTrampolines",
	TRIGGERED_AWNINGS                   = "triggeredAwnings",
	TRIGGERED_UMBRELLAS                 = "triggeredUmbrellas",

	PROJECTILES_FIRED                   = "projectilesFired",
	PROJECTILES_HIT_BALLOONS            = "projectilesHitBalloons",
	PROJECTILES_HIT_FUEL_PICKUPS        = "projectilesHitFuelPickups",
	PROJECTILES_HIT_PLAYERS             = "projectilesHitPlayers",
	PROJECTILES_HIT_BY_PLAYERS          = "projectilesHitByPlayers",

	KNOCKBACKS_FROM_OWN_EXPLOSIONS      = "knockbacksFromOwnExplosions",
	KNOCKBACKS_FROM_OTHER_EXPLOSIONS    = "knockbacksFromOtherExplosions",
	KNOCKBACKS_DEALT_BY_EXPLOSIONS      = "knockbacksDealtByExplosions",
	
	FOUND_ALL_PIGEONS                   = "foundAllPigeons",
}
