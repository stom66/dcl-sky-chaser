export enum ClientEvents {
	NOTIFY_TRIGGER         = "notifyTrigger",     // used when server notifies client about a trigger effect

	GAME_IDLE              = "gameIdle",
	GAME_STARTING          = "gameStarting",
	GAME_ACTIVE            = "gameStarted",
	GAME_END               = "gameEnd",
	
	TRIGGER_RING           = "triggerRing",
	TRIGGER_FUEL           = "triggerFuel",
	TRIGGER_BALLOON        = "triggerBalloon",

	FOUND_ALL_PIGEONS      = "foundAllPigeons",
	TRIGGER_PIGEON         = "triggerPigeon",
	TRIGGER_AWNING         = "triggerAwning",
	TRIGGER_UMBRELLA       = "triggerUmbrella",
	TRIGGER_TRAMPOLINE     = "triggerTrampoline",

	TRIGGER_PROJECTILE     = "triggerProjectile",
	TRIGGER_EXPLOSION      = "triggerExplosion",

	PROJECTILE_HIT_FUEL    = "projectileHitFuel",
	PROJECTILE_HIT_BALLOON = "projectileHitBalloon",
	//PROJECTILE_HIT_RING    = "projectileHitRing",
	PROJECTILE_HIT_PLAYER  = "projectileHitPlayer",

	COMBO_INCREASE         = "comboIncrease",
	COMBO_DECREASE         = "comboDecrease",
}
