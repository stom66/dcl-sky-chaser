import { onEnterScene, onLeaveScene } from "@dcl/sdk/players"
import * as utils from "@dcl-sdk/utils"

import { ServerSettings } from "src/shared/settings"

import { ComponentManager } from "src/shared/components/componentManager"
import { ComponentStore } from "src/shared/components/componentStore"

import { serverHandler } from "src/server/serverHandler"
import { ServerMessaging } from "src/server/serverMessaging"
import { ServerStore } from "src/server/serverStore"
import { LeaderboardManager } from "./leaderboardManager"
import { Metrics } from "./metrics/client"
import { Transform } from "@dcl/sdk/ecs"
import { DiscordWebhooks } from "src/shared/utils/discord-webhooks"


export async function initServer(): Promise<void> {
	console.log("Server: initServer()")

	
	ComponentManager.init()
	ComponentStore.init()
	
	serverHandler.init()
	const serverStore = ServerStore.getInstance() // Initialize the store

	// Initialize the leaderboard manager
	LeaderboardManager.init()

	// Periodically send the server time to the clients
	ServerMessaging.sendServerTime()
	utils.timers.setInterval(() => {
		ServerMessaging.sendServerTime()
	}, ServerSettings.SERVER_TIME_UPDATE_INTERVAL)


	// MARK: Event bindings
	onEnterScene((player) => {
		ServerMessaging.sendServerTime()
		serverStore.addPlayer(player.userId, player.name)

		const playerPosition = Transform.getOrNull(player.entity)?.position
		DiscordWebhooks.newPlayer(player.name, player.userId, playerPosition)

		Metrics.startSession(player.userId, player.name)
	})

	onLeaveScene((userId) => {
		serverStore.removePlayer(userId)
		Metrics.endSession(userId)
	})
}
 