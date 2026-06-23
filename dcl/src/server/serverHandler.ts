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

	// MARK: Start New Game
	function StartNewGame() {
		const currentGameStatus = ComponentStore.getGameStatus()
		if (currentGameStatus !== GameStatus.IDLE) {
			console.log('StartNewGame: game is not idle, skipping')
			return
		}

		ComponentStore.setGameStartTime(Date.now() + GameSettings.COUNTDOWN_DURATION)
		ComponentStore.setGameStatus(GameStatus.STARTING)

		utils.timers.setTimeout(() => {
			OnGameStart()
		}, GameSettings.COUNTDOWN_DURATION)

		utils.timers.setTimeout(() => {
			OnGameEnd()
		}, GameSettings.COUNTDOWN_DURATION + GameSettings.GAME_DURATION)

		utils.timers.setTimeout(() => {
			OnGameReset()
		}, GameSettings.COUNTDOWN_DURATION + GameSettings.GAME_DURATION + GameSettings.END_GAME_DURATION)
	}


	// MARK: On Game Start
	function OnGameStart() {
		ComponentStore.setGameStatus(GameStatus.ACTIVE)
	}

	// MARK: On Game End
	function OnGameEnd() {
		// Submit scores to leaderboards
		const scores = ComponentStore.getPlayerScores()

		// Get the current highest score
		const lbAlltimeHighestScore = scores.reduce((max, score) => Math.max(max, score.score), 0)
		const lbWeeklyHighestScore = scores.reduce((max, score) => Math.max(max, score.score), 0)

		for (const score of scores) {
			// All time scores
			LeaderboardManager.submitScore('alltime', score.userId, score.score)
			if (score.score > lbAlltimeHighestScore) {
				room.send(MessageType.NOTIFY_LEADERBOARD_WINNER_ALL_TIME, {
					sentAt: Date.now()
				}, { to: [score.userId] })
			}

			// Weekly scores
			LeaderboardManager.submitScore('weekly', score.userId, score.score)
			if (score.score > lbWeeklyHighestScore) {
				room.send(MessageType.NOTIFY_LEADERBOARD_WINNER_WEEKLY, {
					sentAt: Date.now()
				}, { to: [score.userId] })
			}
		}

		ComponentStore.setGameStatus(GameStatus.ENDING)
	}

	// MARK: On Game Reset
	function OnGameReset() {
		ComponentStore.setGameStatus(GameStatus.IDLE)
		ComponentStore.resetAfterRound()
	}
}
