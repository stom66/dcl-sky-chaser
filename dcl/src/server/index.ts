import { onEnterScene, onLeaveScene } from "@dcl/sdk/players"
import * as utils from "@dcl-sdk/utils"

import { ServerSettings } from "src/shared/settings"

import { ComponentManager } from "src/shared/components/componentManager"
import { ComponentStore } from "src/shared/components/componentStore"

import { serverHandler } from "src/server/serverHandler"
import { ServerMessaging } from "src/server/serverMessaging"
import { LeaderboardManager } from "./leaderboardManager"
import { Metrics } from "./metrics/client"
import { Transform } from "@dcl/sdk/ecs"
import { DiscordWebhooks } from "src/shared/utils/discord-webhooks"
import { isBlockedPlayer } from "./metrics/blocklist"


export async function initServer(): Promise<void> {
	console.log("Server: initServer()")

	
	ComponentManager.init()
	ComponentStore.init()
	
	serverHandler.init()

	// Initialize the leaderboard manager
	LeaderboardManager.init()

	// Periodically send the server time to the clients
	ServerMessaging.sendServerTime()
	utils.timers.setInterval(() => {
		ServerMessaging.sendServerTime()
	}, ServerSettings.SERVER_TIME_UPDATE_INTERVAL)

	Metrics.init()


	// MARK: Event bindings
	onEnterScene((player) => {
		ServerMessaging.sendServerTime()
		ComponentStore.addPlayer(player.userId)

		if (!isBlockedPlayer(player.userId)) {
			const playerPosition = Transform.getOrNull(player.entity)?.position
			DiscordWebhooks.newPlayer(player.name, player.userId, playerPosition)
		}

		Metrics.startSession(player.userId, player.name)
	})

	onLeaveScene((userId) => {
		ComponentStore.removePlayer(userId)
		Metrics.endSession(userId)
	})
}
 