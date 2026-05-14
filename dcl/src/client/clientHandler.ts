import { MessageType, room } from "src/shared/room"
import type { NotifyFooBarPayload, NotifyServerTimePayload } from "src/shared/types/shared-types"
import { clockSync } from "src/shared/utils/clockSync"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"


// MARK: handleNotifyFooResult
function handleNotifyFooResult(data: NotifyFooBarPayload): void {
	console.log("ClientHandler: handleNotifyFooResult:", data)
	eventBus.emit(ClientEvents.GOT_FOO, data)
}


export namespace ClientHandler {
	export function init() {
		room.onMessage(MessageType.NOTIFY_SERVER_TIME, (data) => { handleNotifyServerTime(data) })
		room.onMessage(MessageType.NOTIFY_FOO_RESULT, handleNotifyFooResult)
	}


	// MARK: Server Time
	function handleNotifyServerTime(data: NotifyServerTimePayload) {
		console.log("ClientHandler: handleNotifyServerTime: data", data)
		clockSync.updateOffset(data.sentAt)
	}
}
