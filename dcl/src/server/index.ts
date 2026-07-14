import { onEnterScene, onLeaveScene } from "@dcl/sdk/players"
import * as utils from "@dcl-sdk/utils"

import { ServerSettings } from "src/shared/settings"
import { GameStatus } from "src/shared/enums"

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

	// Send a batch of server times to the clients to get an inital average
	for (let i = 0; i < 10; i++) {
		utils.timers.setTimeout(() => {
			ServerMessaging.sendServerTime()
		}, 500 * i)
	}
	// Periodically send the server time to the clients
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

		Metrics.sessionStart(player.userId, player.name)
	})

	onLeaveScene((userId) => {
		const gameStatus    = ComponentStore.getGameStatus()
		const gameStartTime = ComponentStore.getGameStartTime()

		ComponentStore.removePlayer(userId)
		Metrics.sessionEnd(userId)

		if (gameStatus === GameStatus.ACTIVE && ComponentStore.getPlayers().length === 0) {
			Metrics.trackGameAborted(gameStartTime, [])
			serverHandler.resetGameCreator()
		}
	})
}
 