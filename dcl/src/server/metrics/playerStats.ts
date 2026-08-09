import { Storage } from "@dcl/sdk/server"

import { ComponentStore } from "src/shared/components/componentStore"
import { PlayerStatsEnum, PlayerStatsRecord } from "src/shared/metrics/playerStats"

export { PlayerStatsEnum as PlayerStats, PlayerStatsRecord } from "src/shared/metrics/playerStats"


export namespace PlayerStatsTracker {
	// MARK: Vars
	const storageKey        = "playerStats"
	const gameStats         = new Map<string, PlayerStatsRecord>()
	const sessionStats      = new Map<string, PlayerStatsRecord>()
	const allTimeStats      = new Map<string, PlayerStatsRecord>()
	const allTimeWriteQueue = new Map<string, Promise<void>>()


	// MARK: createEmptyStats
	function createEmptyStats(): PlayerStatsRecord {
		return Object.fromEntries(
			Object.values(PlayerStatsEnum).map((stat) => [stat, 0])
		) as PlayerStatsRecord
	}


	// MARK: cloneStats
	function cloneStats(record: PlayerStatsRecord): PlayerStatsRecord {
		return { ...record }
	}


	// MARK: publishStatsEntity
	function publishStatsEntity(userId: string): void {
		ComponentStore.createPlayerStatsEntity(
			userId,
			getGameStats(userId),
			getSessionStats(userId),
			getAllTimeStats(userId)
		)
	}


	// MARK: publishGameStats
	function publishGameStats(userId: string): void {
		ComponentStore.setPlayerStatsPerGame(userId, getGameStats(userId))
	}


	// MARK: publishSessionStats
	function publishSessionStats(userId: string): void {
		ComponentStore.setPlayerStatsPerSession(userId, getSessionStats(userId))
	}


	// MARK: publishAllTimeStats
	function publishAllTimeStats(userId: string): void {
		ComponentStore.setPlayerStatsAllTime(userId, getAllTimeStats(userId))
	}


	// MARK: normalizeStats
	function normalizeStats(rawStats: Partial<PlayerStatsRecord> | undefined): PlayerStatsRecord {
		const normalized = createEmptyStats()

		if (!rawStats) {
			return normalized
		}

		for (const stat of Object.values(PlayerStatsEnum)) {
			const value = rawStats[stat]
			normalized[stat] = typeof value === "number" ? value : 0
		}

		return normalized
	}


	// MARK: incrementRecord
	function incrementRecord(
		record: PlayerStatsRecord,
		stat  : PlayerStatsEnum,
		amount: number
	): void {
		record[stat] += amount
	}


	// MARK: readAllTimeStats
	async function readAllTimeStats(userId: string): Promise<PlayerStatsRecord> {
		const raw = await Storage.player.get<string>(userId, storageKey)
		if (!raw) {
			return createEmptyStats()
		}

		try {
			return normalizeStats(JSON.parse(raw) as Partial<PlayerStatsRecord>)
		} catch (error) {
			console.error(`PlayerStatsTracker: readAllTimeStats: failed to parse "${storageKey}" for "${userId}"`, error)
			return createEmptyStats()
		}
	}


	// MARK: queueAllTimeWrite
	function queueAllTimeWrite(
		userId                 : string,
		stat                   : PlayerStatsEnum,
		amount                 : number,
		cacheAlreadyIncremented: boolean
	): void {
		const queuedWrite = (allTimeWriteQueue.get(userId) ?? Promise.resolve()).then(async () => {
			const record = allTimeStats.get(userId) ?? await readAllTimeStats(userId)

			if (!cacheAlreadyIncremented) {
				incrementRecord(record, stat, amount)
			}

			allTimeStats.set(userId, record)
			publishAllTimeStats(userId)

			try {
				await Storage.player.set(userId, storageKey, JSON.stringify(record))
				console.log(`PlayerStatsTracker: queueAllTimeWrite: wrote "${storageKey}" for "${userId}"`, record)
			} catch (error) {
				console.error(`PlayerStatsTracker: queueAllTimeWrite: failed to write "${storageKey}" for "${userId}"`, error)
			}
		})

		allTimeWriteQueue.set(userId, queuedWrite.catch(() => undefined))
	}


	// MARK: ensureAllTimeStats
	function ensureAllTimeStats(userId: string): void {
		const queuedRead = (allTimeWriteQueue.get(userId) ?? Promise.resolve()).then(async () => {
			if (allTimeStats.has(userId)) {
				return
			}

			allTimeStats.set(userId, await readAllTimeStats(userId))
			publishAllTimeStats(userId)
		})

		allTimeWriteQueue.set(userId, queuedRead.catch(() => undefined))
	}


	// MARK: sessionStart
	/**
	 * Initializes per-session tracking and queues an all-time stats read for the player.
	 */
	export function sessionStart(userId: string): void {
		sessionStats.set(userId, createEmptyStats())
		gameStats.set(userId, createEmptyStats())
		publishStatsEntity(userId)
		ensureAllTimeStats(userId)
	}


	// MARK: sessionEnd
	/**
	 * Clears in-memory session and game stats for a player leaving the scene.
	 */
	export function sessionEnd(userId: string): void {
		sessionStats.delete(userId)
		gameStats.delete(userId)
		ComponentStore.removePlayerStatsEntity(userId)
	}


	// MARK: gameStart
	/**
	 * Resets per-game tracking when a player enters a game.
	 */
	export function gameStart(userId: string): void {
		gameStats.set(userId, createEmptyStats())
		publishStatsEntity(userId)
	}


	// MARK: gameEnd
	/**
	 * Clears per-game tracking for the provided players.
	 */
	export function gameEnd(playerIds: string[]): void {
		for (const playerId of playerIds) {
			gameStats.delete(playerId)
			publishGameStats(playerId)
		}
	}


	// MARK: increment
	/**
	 * Increments per-game, per-session, and all-time stats for a player.
	 */
	export function increment(
		userId: string,
		stat  : PlayerStatsEnum,
		amount: number = 1
	): void {
		const currentSessionStats = sessionStats.get(userId)
		const currentGameStats    = gameStats.get(userId)

		if (currentSessionStats) {
			incrementRecord(currentSessionStats, stat, amount)
			publishSessionStats(userId)
		}

		if (currentGameStats) {
			incrementRecord(currentGameStats, stat, amount)
			publishGameStats(userId)
		}

		const currentAllTimeStats = allTimeStats.get(userId)
		if (currentAllTimeStats) {
			incrementRecord(currentAllTimeStats, stat, amount)
			publishAllTimeStats(userId)
		}

		queueAllTimeWrite(userId, stat, amount, Boolean(currentAllTimeStats))
	}


	// MARK: getSessionStats
	/**
	 * Returns the player's current session stats, or an empty record if none exist.
	 */
	export function getSessionStats(userId: string): PlayerStatsRecord {
		return cloneStats(sessionStats.get(userId) ?? createEmptyStats())
	}


	// MARK: getGameStats
	/**
	 * Returns the player's current game stats, or an empty record if none exist.
	 */
	export function getGameStats(userId: string): PlayerStatsRecord {
		return cloneStats(gameStats.get(userId) ?? createEmptyStats())
	}


	// MARK: getAllTimeStats
	/**
	 * Returns the cached all-time stats, or an empty record while storage is still loading.
	 */
	export function getAllTimeStats(userId: string): PlayerStatsRecord {
		return cloneStats(allTimeStats.get(userId) ?? createEmptyStats())
	}
}
