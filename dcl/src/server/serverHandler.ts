import * as utils from "@dcl-sdk/utils"

import { ComponentStore } from 'src/shared/components/componentStore'
import { MessageType, room } from 'src/shared/room'

import { ServerMessaging } from 'src/server/serverMessaging'
import { GameStatus } from 'src/shared/enums'
import { GameSettings } from 'src/shared/settings'
import { LeaderboardManager } from "./leaderboardManager"
import { Metrics } from "./metrics/client"
import { PlayerStats } from "./metrics/playerStats"


export namespace serverHandler {


	// MARK: Init
	export function init() {
		room.onMessage(MessageType.REQUEST_NEW_GAME, (data, context) => handleRequestNewGame(data, context))
		//room.onMessage(MessageType.REQUEST_SCORE_UPDATE, (data, context) => handleRequestScoreUpdate(data, context))
		room.onMessage(MessageType.REQUEST_STATS_UPDATE, (data, context) => handleRequestStatsUpdate(data, context))
		room.onMessage(MessageType.REQUEST_FOUND_ALL_PIGEONS, (data, context) => handleRequestFoundAllPigeons(data, context))
		room.onMessage(MessageType.REQUEST_TRIGGER_EFFECT, (data, context) => handleRequestTriggerEffect(data, context))
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

			Metrics.trackGameCreated(userId, ComponentStore.getGameStartTime())
		} else {
			console.log('handleRequestNewGame: game is not idle, skipping')
			return
		}
	}

/* 	// MARK: Request Score Update
	export async function handleRequestScoreUpdate(data: any, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestScoreUpdate: userId', userId)

		ComponentStore.incrementPlayerScore(userId, data)
	} */

	export async function handleRequestStatsUpdate(data: any, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestStatsUpdate: userId', userId, 'stat', data.stat, 'amount', data.amount)

		if (data.stat === PlayerStats.COLLECTED_POINTS) {
			ComponentStore.incrementPlayerScore(userId, data.amount)
		}

		Metrics.incrementPlayerStat(userId, data.stat, data.amount)
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
		
		Metrics.trackGameStarted(ComponentStore.getGameStartTime(), ComponentStore.getPlayers())
	}

	// MARK: On Game End
	function OnGameEnd() {
		// Submit scores to leaderboards
		const scores = ComponentStore.getPlayerScores()

		// Get the current highest score
		const lbAlltimeHighestScore = scores.reduce((max, score) => Math.max(max, score.score), 0)
		const lbWeeklyHighestScore = scores.reduce((max, score) => Math.max(max, score.score), 0)

		for (const [index, score] of scores.entries()) {

			// Winner
			if (index === 0) {
				Metrics.trackGameWon(score.userId, ComponentStore.getGameStartTime())
			} else {
				Metrics.trackGameNotWon(score.userId, ComponentStore.getGameStartTime())
			}

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

		Metrics.trackGameEnded(ComponentStore.getGameStartTime(), ComponentStore.getPlayers(), scores[0]?.userId)
	}

	// MARK: On Game Reset
	function OnGameReset() {
		ComponentStore.setGameStatus(GameStatus.IDLE)
		//ComponentStore.resetAfterRound()
	}


	// MARK: On Trigger Effect
	function handleRequestTriggerEffect(data: any, context: any) {
		const userId = getUserId(context).toLowerCase()
		console.log('handleRequestTriggerEffect: userId', userId, 'effect', data.effect, 'position', data.position, 'direction', data.direction)

		const players = ComponentStore.getPlayers()
		console.log('handleRequestTriggerEffect: players in store: ', players.length, players.join(', '))

		const sendTo = ComponentStore.getPlayers().filter(player => player.toLowerCase() !== userId)
		if (sendTo.length === 0) {
			console.log('handleRequestTriggerEffect: no players to send to, skipping')
			return
		}

		console.log('handleRequestTriggerEffect: sending to', sendTo.length, sendTo.join(', '))
		room.send(MessageType.NOTIFY_TRIGGER_EFFECT, {
			effect   : data.effect,
			position : data.position,
			direction: data.direction
		}, { to: sendTo }) 

		//Metrics.trackTriggerEffect(userId, data.effect, data.position, data.direction)
	}

	// MARK: On Found All Pigeons
	function handleRequestFoundAllPigeons(data: any, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestFoundAllPigeons: userId', userId)


		Metrics.trackFoundAllPigeons(userId)
	}
}
