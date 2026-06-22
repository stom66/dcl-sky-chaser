import * as utils from "@dcl-sdk/utils"

import { ComponentStore } from 'src/shared/components/componentStore'
import { MessageType, room } from 'src/shared/room'

import { ServerMessaging } from 'src/server/serverMessaging'
import { ServerStore } from 'src/server/serverStore'
import { GameStatus } from 'src/shared/enums'
import { GameSettings } from 'src/shared/settings'
import { LeaderboardManager } from "./leaderboardManager"


export namespace serverHandler {

	// MARK: Vars
	const store = ServerStore.getInstance()


	// MARK: Init
	export function init() {
		room.onMessage(MessageType.REQUEST_NEW_GAME, (data, context) => handleRequestNewGame(data, context))
		room.onMessage(MessageType.REQUEST_SCORE_UPDATE, (data, context) => handleRequestScoreUpdate(data, context))
	}


	// MARK: Utility function
	function getUserId(context: any): string {
		return typeof context?.from === 'string' ? context.from : 'unknown'
	}

	// MARK: Request NewGame
	export async function handleRequestNewGame(data: any, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestNewGame: userId', userId)


		if (ComponentStore.getGameStatus() === GameStatus.IDLE) {
			ComponentStore.resetAfterRound()
			StartNewGame()
		} else {
			console.log('handleRequestNewGame: game is not idle, skipping')
			return
		}
	}

	// MARK: Request Score Update
	export async function handleRequestScoreUpdate(data: any, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestScoreUpdate: userId', userId)

		ComponentStore.incrementPlayerScore(userId, data)
	}

	function StartNewGame() {
		const currentGameStatus = ComponentStore.getGameStatus()
		if (currentGameStatus !== GameStatus.IDLE) {
			console.log('StartNewGame: game is not idle, skipping')
			return
		}

		ComponentStore.setGameStartTime(Date.now() + GameSettings.COUNTDOWN_DURATION)
		ComponentStore.setGameStatus(GameStatus.STARTING)

		// MARK: Start Game
		utils.timers.setTimeout(() => {
			ComponentStore.setGameStatus(GameStatus.ACTIVE)
		}, GameSettings.COUNTDOWN_DURATION)


		// MARK: End Game
		utils.timers.setTimeout(() => {
			// Submit scores to leaderboards
			const scores = ComponentStore.getPlayerScores()
			for (const score of scores) {
				LeaderboardManager.submitScore('alltime', score.userId, score.score)
				LeaderboardManager.submitScore('weekly', score.userId, score.score)
			}

			ComponentStore.setGameStatus(GameStatus.ENDING)
		}, GameSettings.COUNTDOWN_DURATION + GameSettings.GAME_DURATION)

		
		// MARK: Reset Game
		utils.timers.setTimeout(() => {
			ComponentStore.setGameStatus(GameStatus.IDLE)
			ComponentStore.resetAfterRound()
		}, GameSettings.COUNTDOWN_DURATION + GameSettings.GAME_DURATION + GameSettings.END_GAME_DURATION)
	}
}
