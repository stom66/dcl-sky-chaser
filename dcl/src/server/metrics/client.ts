import { VERSION } from 'src/shared/data/version'
import { PlayerStatsEnum, PlayerStatsRecord } from 'src/shared/metrics/playerStats'

import { isBlockedPlayer } from 'src/server/metrics/blocklist'
import { MetricEvents } from 'src/server/metrics/metricEvents'
import { PlayerStatsTracker } from 'src/server/metrics/playerStats'
import { Posthog } from 'src/server/metrics/posthog'


export namespace Metrics {
	// MARK: Vars
	const sessions = new Map<string, number>() // userId -> startTimestamp
	export type GameEntryType = "created" | "joined"


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

	function capitalizeStatName(stat: PlayerStatsEnum): string {
		return `${stat.charAt(0).toUpperCase()}${stat.slice(1)}`
	}

	function prefixedStats(
		prefix: string,
		stats : PlayerStatsRecord
	): Record<string, number> {
		return Object.fromEntries(
			Object.values(PlayerStatsEnum).map((stat) => [`${prefix}${capitalizeStatName(stat)}`, stats[stat]])
		)
	}

	function gameStatsPayload(userId: string): Record<string, number> {
		return prefixedStats("game", PlayerStatsTracker.getGameStats(userId))
	}

	function sessionStatsPayload(userId: string): Record<string, number> {
		return prefixedStats("session", PlayerStatsTracker.getSessionStats(userId))
	}

	function allTimeStatsPayload(userId: string): Record<string, number> {
		return prefixedStats("allTime", PlayerStatsTracker.getAllTimeStats(userId))
	}

	export function incrementPlayerStat(
		userId: string, 
		stat  : PlayerStatsEnum,
		amount: number = 1
	): void {
		PlayerStatsTracker.increment(userId, stat, amount)
	}


	// MARK: SessionStart
	export function sessionStart(
		userId     : string, 
		displayName: string
	) {
		if (sessions.has(userId)) return
		if (isBlockedPlayer(userId)) return

		sessions.set(userId, Date.now())
		PlayerStatsTracker.sessionStart(userId)

		trackSceneJoined(userId, displayName)
	}


	// MARK: SessionEnd
	export function sessionEnd(userId: string): void {
		if (isBlockedPlayer(userId)) return

		const startTimestamp = sessions.get(userId)
		if (!startTimestamp) {
			return
		}

		const durationMs = Date.now() - startTimestamp
		const stats      = sessionStatsPayload(userId)
		trackSceneLeft(userId, durationMs, stats)
		updateAllTimePlayerStats(userId)

		sessions.delete(userId)
		PlayerStatsTracker.sessionEnd(userId)

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
		playerStats?: Record<string, number>
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


	// MARK: UpdateAllTimePlayerStats
	/**
	 * Updates PostHog user properties with the latest all-time player stats.
	 */
	export function updateAllTimePlayerStats(userId: string): void {
		if (isBlockedPlayer(userId)) return

		Posthog.identify(userDistinctId(userId), {
			$set: allTimeStatsPayload(userId)
		})

		console.log('Metrics: updateAllTimePlayerStats: userId', userId)
	}


	// MARK: PlayerEnteredGame
	/**
	 * Tracks one player's participation in a started game.
	 */
	export function trackPlayerEnteredGame(
		userId       : string,
		gameStartTime: number,
		entryType    : GameEntryType
	) {
		if (isBlockedPlayer(userId)) return
		
		PlayerStatsTracker.gameStart(userId)
		incrementPlayerStat(userId, PlayerStatsEnum.GAMES_PLAYED)

		if (entryType === "created") {
			incrementPlayerStat(userId, PlayerStatsEnum.GAMES_CREATED)
		}

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_ENTERED_GAME, {
			version              : VERSION,
			gameId               : gameDistinctId(gameStartTime),
			gameStartTime        : gameStartTime,
			entry_type           : entryType,
			sessionStartTimestamp: sessions.get(userId),
			...gameStatsPayload(userId),
		})

		console.log('Metrics: trackPlayerEnteredGame: userId', userId, 'gameStartTime', gameStartTime, 'entryType', entryType)
	}


	// MARK: GameWon
	export function trackGameWon(
		userId       : string, 
		gameStartTime: number
	) {
		if (isBlockedPlayer(userId)) return
		
		incrementPlayerStat(userId, PlayerStatsEnum.GAMES_WON)

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_GAME_WON, {
			version              : VERSION,
			gameId               : gameDistinctId(gameStartTime),
			sessionStartTimestamp: sessions.get(userId),
			...gameStatsPayload(userId),
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
			sessionStartTimestamp: sessions.get(userId),
			...gameStatsPayload(userId),
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
		PlayerStatsTracker.gameEnd(playerIds)

		console.log('Metrics: trackGameAborted: gameId', gameId, 'gameStartTime', gameStartTime, 'playerCount', playerIds.length)
	}


	// MARK: GameCreated
	export function trackGameCreated(
		userId       : string, 
		gameStartTime: number,
	) {
		const gameId = gameDistinctId(gameStartTime)
		Posthog.capture(gameId, MetricEvents.GAME_CREATED, {
			version        : VERSION,
			gameStartTime  : gameStartTime,
			createdByUserId: isBlockedPlayer(userId) ? undefined : userId,
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

		for (const playerId of playerIds) {
			trackPlayerGameEnded(playerId, gameStartTime, winnerUserId)
		}

		PlayerStatsTracker.gameEnd(playerIds)

		console.log('Metrics: trackGameEnded: gameId', gameId, 'gameStartTime', gameStartTime, 'playerCount', playerIds.length, 'winnerUserId', winnerUserId)
	}


	// MARK: PlayerGameEnded
	/**
	 * Captures one player's final game-scoped stats before they are reset.
	 */
	export function trackPlayerGameEnded(
		userId       : string,
		gameStartTime: number,
		winnerUserId : string | undefined
	): void {
		if (isBlockedPlayer(userId)) return

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_GAME_ENDED, {
			version              : VERSION,
			gameId               : gameDistinctId(gameStartTime),
			winnerUserId         : winnerUserId,
			won                  : userId === winnerUserId,
			sessionStartTimestamp: sessions.get(userId),
			...gameStatsPayload(userId),
		})

		console.log('Metrics: trackPlayerGameEnded: userId', userId, 'gameStartTime', gameStartTime, 'winnerUserId', winnerUserId)
	}


	// MARK: FoundAllPigeons
	export function trackFoundAllPigeons(
		userId: string
	) {
		if (isBlockedPlayer(userId)) return
		
		incrementPlayerStat(userId, PlayerStatsEnum.FOUND_ALL_PIGEONS)

		Posthog.capture(userDistinctId(userId), MetricEvents.PLAYER_FOUND_ALL_PIGEONS, {
			version              : VERSION,
			sessionStartTimestamp: sessions.get(userId),
			...sessionStatsPayload(userId),
		})

		console.log('Metrics: trackGameJoined: userId', userId)
	}

}
