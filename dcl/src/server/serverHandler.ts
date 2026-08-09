import * as utils from "@dcl-sdk/utils"

import { LeaderboardScore } from "src/shared/classes/leaderboard"
import { ComponentStore } from 'src/shared/components/componentStore'
import { GameStatus } from 'src/shared/enums'
import { PlayerStatsEnum } from "src/shared/metrics/playerStats"
import { MessageType, room } from 'src/shared/room'
import { GameSettings } from 'src/shared/settings'

import { LeaderboardManager } from "src/server/leaderboardManager"
import { isBlockedPlayer } from "src/server/metrics/blocklist"
import { Metrics } from "src/server/metrics/client"
import { MostWantedManager } from "src/server/mostWantedManager"
import { ServerMessaging } from "src/server/serverMessaging"


export namespace serverHandler {

	const projectileCooldowns: Map<string, number> = new Map()
	let currentGameCreatorUserId: string | undefined


	// MARK: ResetGameCreator
	/**
	 * Clears the creator remembered for the current game lifecycle.
	 */
	export function resetGameCreator(): void {
		currentGameCreatorUserId = undefined
	}

	// MARK: Init
	export function init() {
		room.onMessage(MessageType.REQUEST_NEW_GAME, (data, context) => handleRequestNewGame(data, context))
		//room.onMessage(MessageType.REQUEST_SCORE_UPDATE, (data, context) => handleRequestScoreUpdate(data, context))
		room.onMessage(MessageType.REQUEST_STATS_UPDATE, (data, context) => handleRequestStatsUpdate(data, context))
		room.onMessage(MessageType.REQUEST_FOUND_ALL_PIGEONS, (data, context) => handleRequestFoundAllPigeons(data, context))
		room.onMessage(MessageType.REQUEST_TRIGGER_EFFECT, (data, context) => handleRequestTriggerEffect(data, context))
		room.onMessage(MessageType.REQUEST_PROJECTILE, (data, context) => handleRequestProjectile(data, context))
		room.onMessage(MessageType.REQUEST_PROJECTILE_PLAYER_HIT, (data, context) => handleRequestProjectilePlayerHit(data, context))
		room.onMessage(MessageType.REQUEST_EXPLOSION_KNOCKBACK, (data, context) => handleRequestExplosionKnockback(data, context))
	}


	// MARK: Utility function
	function getUserId(context: any): string {
		return typeof context?.from === 'string' ? context.from : 'unknown'
	}


	// MARK: Get Game Entry Type
	function getGameEntryType(playerId: string): Metrics.GameEntryType {
		return playerId.toLowerCase() === currentGameCreatorUserId?.toLowerCase() ? "created" : "joined"
	}

	// MARK: Request NewGame
	export async function handleRequestNewGame(data: any, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestNewGame: userId', userId)


		if (ComponentStore.getGameStatus() === GameStatus.IDLE) {
			ComponentStore.resetAfterRound()
			currentGameCreatorUserId = userId
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

		if (data.stat === PlayerStatsEnum.COLLECTED_POINTS) {
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

		const gameStartTime = ComponentStore.getGameStartTime()
		const players       = ComponentStore.getPlayers()

		Metrics.trackGameStarted(gameStartTime, players)

		for (const playerId of players) {
			Metrics.trackPlayerEnteredGame(playerId, gameStartTime, getGameEntryType(playerId))
		}
	}

	// MARK: On Game End
	async function OnGameEnd() {
		// Submit scores to leaderboards
		const scores                = ComponentStore.getPlayerScores()
		const leaderboardAllTime    = await LeaderboardManager.getLeaderboardAllTime()
		const leaderboardWeekly     = await LeaderboardManager.getLeaderboardWeekly()
		const allTimeScores         : LeaderboardScore[] = []
		const weeklyScores          : LeaderboardScore[] = []

		// Get the previous highest leaderboard scores before this round is submitted.
		const lbAlltimeHighestScore = leaderboardAllTime.reduce((max, entry) => Math.max(max, entry.score), 0)
		const lbWeeklyHighestScore  = leaderboardWeekly.reduce((max, entry) => Math.max(max, entry.score), 0)

		for (const [index, score] of scores.entries()) {

			// Winner
			if (index === 0) {
				Metrics.trackGameWon(score.userId, ComponentStore.getGameStartTime())
			} else {
				Metrics.trackGameNotWon(score.userId, ComponentStore.getGameStartTime())
			}

			allTimeScores.push({
				userId        : score.userId,
				score         : score.score,
				isNewHighscore: score.score > lbAlltimeHighestScore
			})

			if (score.score > lbAlltimeHighestScore) {
				// We no longer send an event to the player, isjntead we upadte this in the client component
				ComponentStore.flagPlayerAsNewHighscore(score.userId)
				/* room.send(MessageType.NOTIFY_LEADERBOARD_WINNER_ALL_TIME, {
					sentAt: Date.now()
				}, { to: [score.userId] }) */
			}

			weeklyScores.push({
				userId: score.userId,
				score : score.score,
				isNewHighscore: score.score > lbAlltimeHighestScore
			})

			if (score.score > lbWeeklyHighestScore) {
				ComponentStore.flagPlayerAsNewHighscore(score.userId)
				/* room.send(MessageType.NOTIFY_LEADERBOARD_WINNER_WEEKLY, {
					sentAt: Date.now()
				}, { to: [score.userId] }) */
			}
		}

		await LeaderboardManager.submitScores('alltime', allTimeScores)
		await LeaderboardManager.submitScores('weekly', weeklyScores)

		ComponentStore.setGameStatus(GameStatus.ENDING)

		Metrics.trackGameEnded(ComponentStore.getGameStartTime(), ComponentStore.getPlayers(), scores[0]?.userId)
		resetGameCreator()
	}

	// MARK: On Game Reset
	function OnGameReset() {
		ComponentStore.setGameStatus(GameStatus.IDLE)
		resetGameCreator()
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

		if (userId === 'unknown' || isBlockedPlayer(userId)) {
			return
		}

		Metrics.trackFoundAllPigeons(userId)

		MostWantedManager.setWantedForPigeons(userId)
	}



	// MARK: On Projectile
	function handleRequestProjectile(data: any, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestProjectile: userId', userId, 'position', data.position, 'direction', data.direction)

		const lastProjectileTime = projectileCooldowns.get(userId) ?? 0
		const timeSinceLastProjectile = Date.now() - lastProjectileTime

		if (timeSinceLastProjectile > GameSettings.PROJECTILE_COOLDOWN) {
			projectileCooldowns.set(userId, Date.now())
			Metrics.incrementPlayerStat(userId, PlayerStatsEnum.PROJECTILES_FIRED)

			const sendTo = ComponentStore.getPlayers().filter(player => player.toLowerCase() !== userId)
			if (sendTo.length === 0) {
				console.log('handleRequestProjectile: no players to send to, skipping')
				return
			}

			room.send(MessageType.NOTIFY_PROJECTILE, {
				position : data.position,
				direction: data.direction,
				owner    : userId
			}, { to: sendTo })
		} else {
			console.log('handleRequestProjectile: cooldown not ready, skipping')
		}
	}


	// MARK: On Projectile Player Hit
	function handleRequestProjectilePlayerHit(data: any, context: any) {
		const recipientUserId = getUserId(context)
		const projectileOwner = typeof data?.projectileOwner === "string" ? data.projectileOwner : ""
		console.log('handleRequestProjectilePlayerHit: recipientUserId', recipientUserId, 'projectileOwner', projectileOwner)

		if (projectileOwner === "") return
		if (projectileOwner.toLowerCase() === recipientUserId.toLowerCase()) return

		Metrics.incrementPlayerStat(projectileOwner, PlayerStatsEnum.PROJECTILES_HIT_PLAYERS)
		Metrics.incrementPlayerStat(recipientUserId, PlayerStatsEnum.PROJECTILES_HIT_BY_PLAYERS)
		ComponentStore.incrementPlayerScore(projectileOwner, 1)
	}


	// MARK: On Explosion Knockback
	function handleRequestExplosionKnockback(data: any, context: any) {
		const recipientUserId = getUserId(context)
		const projectileOwner = typeof data?.projectileOwner === "string" ? data.projectileOwner : ""
		console.log('handleRequestExplosionKnockback: recipientUserId', recipientUserId, 'projectileOwner', projectileOwner)

		if (projectileOwner === "") return
		if (projectileOwner.toLowerCase() === recipientUserId.toLowerCase()) return

		Metrics.incrementPlayerStat(projectileOwner, PlayerStatsEnum.KNOCKBACKS_DEALT_BY_EXPLOSIONS)
		Metrics.incrementPlayerStat(recipientUserId, PlayerStatsEnum.KNOCKBACKS_FROM_OTHER_EXPLOSIONS)
	}
}
