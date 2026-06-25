import { registerMessages } from '@dcl/sdk/network'
import { Schemas } from '@dcl/sdk/ecs'
import { PlayerStats } from 'src/server/metrics/playerStats'
import { ClientEvents } from 'src/client/clientEvents'


// MARK: MessageTypes
export enum MessageType {
	REQUEST_NEW_GAME                   = 'requestNewGame',
	REQUEST_SCORE_UPDATE               = 'requestScoreUpdate',
	REQUEST_STATS_UPDATE               = 'requestStatsUpdate',
	REQUEST_FOUND_ALL_PIGEONS          = 'requestFoundAllPigeons',
	REQUEST_TRIGGER_EFFECT             = 'requestTriggerEffect',
	REQUEST_PROJECTILE                 = 'requestProjectile',

	NOTIFY_SERVER_TIME                 = "notifyServerTime",
	NOTIFY_LEADERBOARD_WINNER_WEEKLY   = "notifyLeaderboardWinnerWeekly",
	NOTIFY_LEADERBOARD_WINNER_ALL_TIME = "notifyLeaderboardWinnerAllTime",
	NOTIFY_TRIGGER_EFFECT              = "notifyTriggerEffect",
	NOTIFY_PROJECTILE                  = "notifyProjectile",
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
		stat  : Schemas.EnumString(PlayerStats, PlayerStats.COLLECTED_BALLOONS),
		amount: Schemas.Int,
	}),
	[MessageType.REQUEST_FOUND_ALL_PIGEONS]: Schemas.Map({}),
	[MessageType.REQUEST_TRIGGER_EFFECT]: Schemas.Map({
		effect   : Schemas.EnumString(ClientEvents, ClientEvents.TRIGGER_FUEL),
		position : Schemas.Vector3,
		direction: Schemas.Vector3,
	}),
	[MessageType.REQUEST_PROJECTILE]: Schemas.Map({
		position : Schemas.Vector3,
		direction: Schemas.Vector3
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
		effect   : Schemas.EnumString(ClientEvents, ClientEvents.TRIGGER_FUEL),
		position : Schemas.Vector3,
		direction: Schemas.Vector3,
	}),
	[MessageType.NOTIFY_PROJECTILE]: Schemas.Map({
		position : Schemas.Vector3,
		direction: Schemas.Vector3,
		owner    : Schemas.String,
	}),
}

// Export room
export const room = registerMessages(Messages)
