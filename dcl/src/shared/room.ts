import { registerMessages } from '@dcl/sdk/network'
import { Schemas } from '@dcl/sdk/ecs'


// MARK: MessageTypes
export enum MessageType {
	REQUEST_FOO = 'requestFoo',

	NOTIFY_FOO_RESULT = "notifyFooResult",
	NOTIFY_SERVER_TIME = "notifyServerTime",
}

// MARK: Schema constant
const SchemaSentAt = {
	sentAt: Schemas.Int64,
}


// MARK: Message schemas
const Messages = {
	// Sent by client
	[MessageType.REQUEST_FOO]: Schemas.Map({
		foo: Schemas.Int64,
	}),

	// Sent by server
	[MessageType.NOTIFY_FOO_RESULT]: Schemas.Map({
		foo: Schemas.String,
		bar: Schemas.Int,
	}),

	[MessageType.NOTIFY_SERVER_TIME]: Schemas.Map({
		...SchemaSentAt
	})
}

// Export room
export const room = registerMessages(Messages)
