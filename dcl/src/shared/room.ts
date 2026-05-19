import { registerMessages } from '@dcl/sdk/network'
import { Schemas } from '@dcl/sdk/ecs'


// MARK: MessageTypes
export enum MessageType {
	REQUEST_NEW_GAME     = 'requestNewGame',
	REQUEST_SCORE_UPDATE = 'requestScoreUpdate',

	NOTIFY_SERVER_TIME   = "notifyServerTime",
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


	// Sent by server
	[MessageType.NOTIFY_SERVER_TIME]: Schemas.Map({
		...SchemaSentAt
	})
}

// Export room
export const room = registerMessages(Messages)
