export type PlayerStatsRecord = Record<PlayerStatsEnum, number>

export enum PlayerStatsEnum {
	GAMES_CREATED                    = "gamesCreated",                  // The number of games created by the player
	GAMES_PLAYED                     = "gamesPlayed",                   // The number of games played by the player
	GAMES_WON                        = "gamesWon",                      // The number of games won by the player

	COLLECTED_POINTS                 = "collectedPoints",               // The number of points collected by the player (includes combo)
	COLLECTED_BALLOONS               = "collectedBalloons",             // The number of balloons collected by the player
	COLLECTED_FUEL_AMOUNT            = "collectedFuelAmount",           // The amount of fuel collected by the player (fuel amount, not barrel count)
	COLLECTED_FUEL_PICKUPS           = "collectedFuelPickups",          // The number of fuel pickups collected by the player

	TRIGGERED_SPEED_RINGS            = "triggeredSpeedRings",           // The number of speed rings triggered by the player
	TRIGGERED_TRAMPOLINES            = "triggeredTrampolines",          // The number of trampolines triggered by the player
	TRIGGERED_AWNINGS                = "triggeredAwnings",              // The number of awnings triggered by the player
	TRIGGERED_UMBRELLAS              = "triggeredUmbrellas",            // The number of umbrellas triggered by the player

	PROJECTILES_FIRED                = "projectilesFired",              // The number of projectiles fired by the player
	PROJECTILES_HIT_BALLOONS         = "projectilesHitBalloons",        // The number of balloons hit by the player with projectiles
	PROJECTILES_HIT_FUEL_PICKUPS     = "projectilesHitFuelPickups",     // The number of fuel pickups hit by the player with projectiles
	PROJECTILES_HIT_PLAYERS          = "projectilesHitPlayers",         // The number of players hit by the player with projectiles
	PROJECTILES_HIT_BY_PLAYERS       = "projectilesHitByPlayers",       // The number of hit received from other players projectiles

	KNOCKBACKS_FROM_OWN_EXPLOSIONS   = "knockbacksFromOwnExplosions",   // The number of knockbacks received from own explosions
	KNOCKBACKS_FROM_OTHER_EXPLOSIONS = "knockbacksFromOtherExplosions", // The number of knockbacks received from other players explosions
	KNOCKBACKS_DEALT_BY_EXPLOSIONS   = "knockbacksDealtByExplosions",   // The number of knockbacks dealt by the player with explosions
	
	FOUND_ALL_PIGEONS                = "foundAllPigeons",               // The number of times all pigeons have been found by the player
}
