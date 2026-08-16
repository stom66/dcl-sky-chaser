import { Vector3 } from "@dcl/sdk/math"

import { MessageType, room } from "src/shared/room"
import type { NotifyServerTimePayload } from "src/shared/types/shared-types"
import { clockSync } from "src/shared/utils/clockSync"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"


export namespace ClientHandler {
	export function init() {
		room.onMessage(MessageType.NOTIFY_SERVER_TIME, (data) => { handleNotifyServerTime(data) })
		room.onMessage(MessageType.NOTIFY_TRIGGER_EFFECT, (data) => { handleNotifyTriggerEffect(data) })
		room.onMessage(MessageType.NOTIFY_PROJECTILE, (data) => { handleNotifyProjectile(data) })
	}


	// MARK: Server Time
	function handleNotifyServerTime(data: NotifyServerTimePayload) {
		//console.log("ClientHandler: handleNotifyServerTime: data", data)
		clockSync.updateOffset(data.sentAt)
	}

	// MARK: Trigger Effect
	function handleNotifyTriggerEffect(data: { effect: ClientEvents, position: Vector3, direction: Vector3 }) {
		console.log('ClientHandler: handleNotifyTriggerEffect: data', data)
		eventBus.emit(ClientEvents.NOTIFY_TRIGGER, {effect: data.effect,  position: data.position, direction: data.direction })
	}

	// MARK: Projectile
	function handleNotifyProjectile(data: { position: Vector3, direction: Vector3, owner: string }) {
		console.log('ClientHandler: handleNotifyProjectile: data', data)
		eventBus.emit(ClientEvents.NOTIFY_PROJECTILE_FIRED, {position: data.position, direction: data.direction, owner: data.owner })
	}
}
