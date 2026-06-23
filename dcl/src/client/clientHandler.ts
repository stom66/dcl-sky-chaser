import { MessageType, room } from "src/shared/room"
import type { NotifyServerTimePayload } from "src/shared/types/shared-types"
import { clockSync } from "src/shared/utils/clockSync"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { ShowUI } from "./ui/layouts/ui.leaderboardWinner"
import { sfx, SoundManager } from "./soundManager"



export namespace ClientHandler {
	export function init() {
		room.onMessage(MessageType.NOTIFY_SERVER_TIME, (data) => { handleNotifyServerTime(data) })
		room.onMessage(MessageType.NOTIFY_LEADERBOARD_WINNER_WEEKLY, (data) => { handleNotifyLeaderboardWinner("WEEKLY") })
		room.onMessage(MessageType.NOTIFY_LEADERBOARD_WINNER_ALL_TIME, (data) => { handleNotifyLeaderboardWinner("ALL TIME") })
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
}
