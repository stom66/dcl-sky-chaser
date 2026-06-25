import { MessageType, room } from "src/shared/room"
import type { NotifyServerTimePayload } from "src/shared/types/shared-types"
import { clockSync } from "src/shared/utils/clockSync"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { ShowUI } from "./ui/layouts/ui.leaderboardWinner"
import { sfx, SoundManager } from "./soundManager"
import { Vector3 } from "@dcl/sdk/math"



export namespace ClientHandler {
	export function init() {
		room.onMessage(MessageType.NOTIFY_SERVER_TIME, (data) => { handleNotifyServerTime(data) })
		room.onMessage(MessageType.NOTIFY_LEADERBOARD_WINNER_WEEKLY, (data) => { handleNotifyLeaderboardWinner("WEEKLY") })
		room.onMessage(MessageType.NOTIFY_LEADERBOARD_WINNER_ALL_TIME, (data) => { handleNotifyLeaderboardWinner("ALL TIME") })
		room.onMessage(MessageType.NOTIFY_TRIGGER_EFFECT, (data) => { handleNotifyTriggerEffect(data) })
	}


	// MARK: Server Time
	function handleNotifyServerTime(data: NotifyServerTimePayload) {
		//console.log("ClientHandler: handleNotifyServerTime: data", data)
		clockSync.updateOffset(data.sentAt)
	}

	// MARK: Leaderboard Winner Weekly
	export function handleNotifyLeaderboardWinner(string: string) {
		ShowUI(string)
		SoundManager.playSound(sfx.leaderboard)
	}

	// MARK: Trigger Effect
	function handleNotifyTriggerEffect(data: { effect: ClientEvents, position: Vector3, direction: Vector3 }) {
		console.log('ClientHandler: handleNotifyTriggerEffect: data', data)
		eventBus.emit(ClientEvents.NOTIFY_TRIGGER, {effect: data.effect,  position: data.position, direction: data.direction })
	}
}
