import { MessageType, room } from "src/shared/room"
import { NotifyServerTimePayload } from "src/shared/types/shared-types"


export namespace ServerMessaging {
	
	// MARK: sendServerTime
	export function sendServerTime() {
		const payload: NotifyServerTimePayload = {
			sentAt: Date.now()
		}
		room.send(MessageType.NOTIFY_SERVER_TIME, payload)
	}
}
