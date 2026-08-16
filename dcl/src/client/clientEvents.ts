

export enum ClientEvents {
	LOAD_COMPLETE              = "load_Complete",

	SPECTATE_ENABLED           = "spectate_Enabled",
	SPECTATE_DISABLED          = "spectate_Disabled",

	NOTIFY_TRIGGER             = "notifyTrigger",         // SERVER  used when server notifies client about a trigger effect
	NOTIFY_PROJECTILE_FIRED    = "notifyProjectileFired", // Fired by ProjectileManager for LOCAL projectiles

	GAME_IDLE                  = "game_Idle",
	GAME_STARTING              = "game_Starting",
	GAME_ACTIVE                = "game_Started",
	GAME_END                   = "game_End",

	
	PROJECTILE_HIT_YOU         = "projectile_HitYou",     // odd one out, is YOU being hit by ENEMY birdstrike
	PROJECTILE_FIRED           = "projectile_Fired",      // Fired by ProjectileManager for LOCAL projectiles
	PROJECTILE_HIT_PLAYER      = "projectile_HitPlayer",
	PROJECTILE_HIT_BALLOON     = "projectile_HitBalloon", // When ANY projectile hits a balloon
	PROJECTILE_HIT_FUEL        = "projectile_HitFuel",
	PROJECTILE_MISSED          = "projectile_Missed",     // triggered when one of your projectiles reaches its max age
	
	
	PLAYER_COLLIDED_FUEL       = "playerCollided_Fuel",
	PLAYER_COLLIDED_BALLOON    = "playerCollided_Balloon",
	PLAYER_COLLIDED_RING       = "playerCollided_Ring",

	PLAYER_COLLIDED_AWNING     = "playerCollided_Awning",
	PLAYER_COLLIDED_UMBRELLA   = "playerCollided_Umbrella",
	PLAYER_COLLIDED_TRAMPOLINE = "playerCollided_Trampoline",

	PLAYER_COMBO_INCREASE      = "combo_Increase",
	PLAYER_COMBO_DECREASE      = "combo_Decrease",
	
	PLAYER_TOUCHED_PIGEON      = "playerTouched_Pigeon",  // When a player clicks on of the 10 pigeons
	PLAYER_FOUND_ALL_PIGEONS   = "playerFoundAllPigeons",

}
