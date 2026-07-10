import { PlayerStats, PlayerStatsRecord } from 'src/server/metrics/playerStats'

import { VERSION } from 'src/shared/data/version'

import { MetricEvents } from 'src/server/metrics/metricEvents'
import { Posthog } from 'src/server/metrics/posthog'
import { isBlockedPlayer } from 'src/server/metrics/blocklist'


export namespace Metrics {
	// MARK: Vars
	const sessions    = new Map<string, number>()            // userId -> startTimestamp
	const playerStats = new Map<string, PlayerStatsRecord>() // userId -> session stats


	// MARK: Init
	export function init() {
		console.log('Metrics: init()')
		Posthog.init()
	}


	// MARK: Utils
	function userDistinctId(userId: string): string {
		return `user_${userId}`
	}

	function gameDistinctId(gameStartTime: number): string {
		return `game_${gameStartTime}`
	}

	function createEmptyPlayerStats(): PlayerStatsRecord {
		return Object.fromEntries(
			Object.values(PlayerStats).map(stat => [stat, 0])
		) as PlayerStatsRecord
	}

	export function incrementPlayerStat(
		userId: string, 
		stat  : PlayerStats,
		amount: number = 1
	): void {
		let record = playerStats.get(userId)
		if (!record) {
			record = createEmptyPlayerStats()
			playerStats.set(userId, record)
		}
		record[stat] += amount
	}


	// MARK: SessionStart
	export function sessionStart(
		userId     : string, 
		displayName: string
	) {
		if (sessions.has(userId)) return
		if (isBlockedPlayer(userId)) return

		sessions.set(userId, Date.now())
		playerStats.set(userId, createEmptyPlayerStats())

		trackSceneJoined(userId, displayName)
	}


	// MARK: SessionEnded
	export function sessionEnd(userId: string): void {
		if (isBlockedPlayer(userId)) return

		const startTimestamp = sessions.get(userId)
		if (!startTimestamp) {
			return
		}

		const durationMs = Date.now() - startTimestamp
		const stats      = playerStats.get(userId)
		trackSceneLeft(userId, durationMs, stats)

		sessions.delete(userId)
		playerStats.delete(userId)

	}


	// MARK: SceneJoined
	export function trackSceneJoined(
		userId     : string, 
		displayName: string
	) {
		if (isBlockedPlayer(userId)) return

		Posthog.identify(userDistinctId(userId), {
			$set: {
				displayName: displayName
			},
			$set_once: {
				walletAddress: userId
			}
		})

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_SCENE_JOINED, {
			version              : VERSION,
			sessionStartTimestamp: sessions.get(userId)
		})

		console.log('Metrics: trackSceneJoined: userId', userId, 'displayName', displayName)
	}


	// MARK: SceneLeft
	export function trackSceneLeft(
		userId      : string, 
		durationMs  : number, 
		playerStats?: PlayerStatsRecord
	) {
		if (isBlockedPlayer(userId)) return
		
		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_SCENE_LEFT, {
			version              : VERSION,
			durationMs           : durationMs,
			sessionStartTimestamp: sessions.get(userId),
			...playerStats,
		})

		console.log('Metrics: trackSceneLeft: userId', userId, 'durationMs', durationMs, 'playerStats', playerStats)
	}



	// MARK: GameJoined
	export function trackGameJoined(
		userId       : string, 
		gameStartTime: number
	) {
		if (isBlockedPlayer(userId)) return
		
		incrementPlayerStat(userId, PlayerStats.GAMES_PLAYED)

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_GAME_JOINED, {
			version              : VERSION,
			gameId               : gameDistinctId(gameStartTime),
			sessionStartTimestamp: sessions.get(userId)
		})

		console.log('Metrics: trackGameJoined: userId', userId, 'gameStartTime', gameStartTime)
	}


	// MARK: GameWon
	export function trackGameWon(
		userId       : string, 
		gameStartTime: number
	) {
		if (isBlockedPlayer(userId)) return
		
		incrementPlayerStat(userId, PlayerStats.GAMES_WON)

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_GAME_WON, {
			version              : VERSION,
			gameId               : gameDistinctId(gameStartTime),
			sessionStartTimestamp: sessions.get(userId)
		})

		console.log('Metrics: trackGameWon: userId', userId, 'gameStartTime', gameStartTime)
	}


	// MARK: GameNotWon
	export function trackGameNotWon(
		userId       : string,
		gameStartTime: number
	) {
		if (isBlockedPlayer(userId)) return

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_GAME_NOT_WON, {
			version              : VERSION,
			gameId               : gameDistinctId(gameStartTime),
			sessionStartTimestamp: sessions.get(userId)
		})

		console.log('Metrics: trackGameNotWon: userId', userId, 'gameStartTime', gameStartTime)
	}


	// MARK: GameAborted
	export function trackGameAborted(
		gameStartTime: number,
		playerIds    : string[]
	) {
		const gameId = gameDistinctId(gameStartTime)
		Posthog.capture(gameId, MetricEvents.GAME_ABORTED, {
			version    : VERSION,
			playerCount: playerIds.length,
			playerIds  : playerIds
		})

		console.log('Metrics: trackGameAborted: gameId', gameId, 'gameStartTime', gameStartTime, 'playerCount', playerIds.length)
	}


	// MARK: GameCreated
	export function trackGameCreated(
		userId       : string, 
		gameStartTime: number,
	) {
		incrementPlayerStat(userId, PlayerStats.GAMES_CREATED)

		const gameId = gameDistinctId(gameStartTime)
		Posthog.capture(gameId, MetricEvents.GAME_CREATED, {
			version        : VERSION,
			gameStartTime  : gameStartTime,
			createdByUserId: userId,
		})

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_GAME_CREATED, {
			version              : VERSION,
			gameId               : gameId,
			sessionStartTimestamp: sessions.get(userId)
		})

		console.log('Metrics: trackGameCreated: gameId', gameId, 'gameStartTime', gameStartTime, 'userId', userId)
	}


	// MARK: GameStarted
	export function trackGameStarted(
		gameStartTime: number, 
		playerIds    : string[]
	) {		
		const gameId = gameDistinctId(gameStartTime)
		Posthog.capture(gameId, MetricEvents.GAME_STARTED, {
			version    : VERSION,
			playerCount: playerIds.length,
			playerIds  : playerIds
		})

		console.log('Metrics: trackGameStarted: gameId', gameId, 'gameStartTime', gameStartTime, 'playerCount', playerIds.length)
	}


	// MARK: GameEnded
	export function trackGameEnded(
		gameStartTime: number, 
		playerIds    : string[], 
		winnerUserId : string | undefined
	) {
		const gameId = gameDistinctId(gameStartTime)
		Posthog.capture(gameId, MetricEvents.GAME_ENDED, {
			version     : VERSION,
			playerCount : playerIds.length,
			playerIds   : playerIds,
			winnerUserId: winnerUserId
		})

		console.log('Metrics: trackGameEnded: gameId', gameId, 'gameStartTime', gameStartTime, 'playerCount', playerIds.length, 'winnerUserId', winnerUserId)
	}


	// MARK: FoundAllPigeons
	export function trackFoundAllPigeons(
		userId: string
	) {
		if (isBlockedPlayer(userId)) return
		
		incrementPlayerStat(userId, PlayerStats.FOUND_ALL_PIGEONS)

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_FOUND_ALL_PIGEONS, {
			version              : VERSION,
			sessionStartTimestamp: sessions.get(userId)
		})

		console.log('Metrics: trackGameJoined: userId', userId)
	}

}
