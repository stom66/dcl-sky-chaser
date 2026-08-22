import { registerMessages } from '@dcl/sdk/network'
import { Schemas } from '@dcl/sdk/ecs'
import { PlayerStatsEnum } from 'src/shared/metrics/playerStats'
import { ClientEvents } from 'src/client/clientEvents'


// MARK: MessageTypes
export enum MessageType {
	REQUEST_NEW_GAME                   = 'requestNewGame',
	REQUEST_SCORE_UPDATE               = 'requestScoreUpdate',
	REQUEST_STATS_UPDATE               = 'requestStatsUpdate',
	REQUEST_FOUND_ALL_PIGEONS          = 'requestFoundAllPigeons',
	REQUEST_TRIGGER_EFFECT             = 'requestTriggerEffect',
	REQUEST_PROJECTILE                 = 'requestProjectile',
	REQUEST_PROJECTILE_PLAYER_HIT      = 'requestProjectilePlayerHit',
	REQUEST_EXPLOSION_KNOCKBACK        = 'requestExplosionKnockback',

	REQUEST_LAUNCH_FIREWORK              = 'requestLaunchFirework',

	NOTIFY_SERVER_TIME                 = "notifyServerTime",
	NOTIFY_LEADERBOARD_WINNER_WEEKLY   = "notifyLeaderboardWinnerWeekly",
	NOTIFY_LEADERBOARD_WINNER_ALL_TIME = "notifyLeaderboardWinnerAllTime",
	NOTIFY_TRIGGER_EFFECT              = "notifyTriggerEffect",
	NOTIFY_PROJECTILE                  = "notifyProjectile",
	NOTIFY_HIT_LANDED                  = "notifyHitLanded",
	NOTIFY_FIREWORK_LAUNCHED           = "notifyFireworkLaunched",
}

// MARK: Schema constant
const SchemaSentAt = {
	sentAt: Schemas.Int64,
}


// MARK: Message schemas
const Messages = {
	// Sent by client
	[MessageType.REQUEST_NEW_GAME]: Schemas.Map({}),
	[MessageType.REQUEST_SCORE_UPDATE]: Schemas.Int,
	[MessageType.REQUEST_STATS_UPDATE]: Schemas.Map({
		stat  : Schemas.EnumString(PlayerStatsEnum, PlayerStatsEnum.COLLECTED_BALLOONS),
		amount: Schemas.Int,
	}),
	[MessageType.REQUEST_FOUND_ALL_PIGEONS]: Schemas.Map({}),
	[MessageType.REQUEST_TRIGGER_EFFECT]: Schemas.Map({
		effect   : Schemas.EnumString(ClientEvents, ClientEvents.PLAYER_COLLIDED_FUEL),
		position : Schemas.Vector3,
		direction: Schemas.Vector3,
		entityId : Schemas.Optional(Schemas.String),
	}),
	[MessageType.REQUEST_PROJECTILE]: Schemas.Map({
		position : Schemas.Vector3,
		direction: Schemas.Vector3
	}),
	[MessageType.REQUEST_PROJECTILE_PLAYER_HIT]: Schemas.Map({
		projectileOwner: Schemas.String
	}),
	[MessageType.REQUEST_EXPLOSION_KNOCKBACK]: Schemas.Map({
		projectileOwner: Schemas.String
	}),
	[MessageType.REQUEST_LAUNCH_FIREWORK]: Schemas.Map({
		entityId: Schemas.String,
	}),


	// Sent by server
	[MessageType.NOTIFY_SERVER_TIME]: Schemas.Map({
		...SchemaSentAt
	}),
	[MessageType.NOTIFY_LEADERBOARD_WINNER_WEEKLY]: Schemas.Map({
		...SchemaSentAt
	}),
	[MessageType.NOTIFY_LEADERBOARD_WINNER_ALL_TIME]: Schemas.Map({
		...SchemaSentAt
	}),
	[MessageType.NOTIFY_TRIGGER_EFFECT]: Schemas.Map({
		effect   : Schemas.EnumString(ClientEvents, ClientEvents.PLAYER_COLLIDED_FUEL),
		position : Schemas.Vector3,
		direction: Schemas.Vector3,
		entityId : Schemas.Optional(Schemas.String),
	}),
	[MessageType.NOTIFY_PROJECTILE]: Schemas.Map({
		position : Schemas.Vector3,
		direction: Schemas.Vector3,
		owner    : Schemas.String,
	}),
	[MessageType.NOTIFY_HIT_LANDED]: Schemas.Map({
		userId: Schemas.String,
	}),
	[MessageType.NOTIFY_FIREWORK_LAUNCHED]: Schemas.Map({
		userId  : Schemas.String,
		entityId: Schemas.String,
	}),
}

// Export room
export const room = registerMessages(Messages)
