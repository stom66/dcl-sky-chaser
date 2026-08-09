import { ComponentStore } from "src/shared/components/componentStore"
import { PlayerStatsEnum, PlayerStatsRecord } from "src/shared/metrics/playerStats"
import { PlayerBackedState } from "src/shared/storage/playerBackedState"
import { ServerEvents } from "src/shared/utils/eventBus"

export { PlayerStatsEnum as PlayerStats, PlayerStatsRecord } from "src/shared/metrics/playerStats"


export namespace PlayerStatsTracker {
	// MARK: Vars
	const storageKey   = "playerStats"
	const gameStats    = new Map<string, PlayerStatsRecord>()
	const sessionStats = new Map<string, PlayerStatsRecord>()
	const allTimeState = new Map<string, PlayerBackedState<PlayerStatsRecord>>()


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


	// MARK: normalizeStats
	function normalizeStats(rawStats: unknown): PlayerStatsRecord {
		const normalized = createEmptyStats()
		const partial    = (rawStats ?? {}) as Partial<PlayerStatsRecord>

		for (const stat of Object.values(PlayerStatsEnum)) {
			const value = partial[stat]
			normalized[stat] = typeof value === "number" ? value : 0
		}

		return normalized
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


	// MARK: incrementRecord
	function incrementRecord(
		record: PlayerStatsRecord,
		stat  : PlayerStatsEnum,
		amount: number
	): void {
		record[stat] += amount
	}


	// MARK: getOrCreateAllTimeState
	function getOrCreateAllTimeState(userId: string): PlayerBackedState<PlayerStatsRecord> {
		const existing = allTimeState.get(userId)
		if (existing) {
			return existing
		}

		const backed = new PlayerBackedState<PlayerStatsRecord>({
			userId,
			key            : storageKey,
			createDefault  : createEmptyStats,
			normalize      : normalizeStats,
			writeOnUpdate  : false,
			persistOnEvents: [
				ServerEvents.GAME_END,
				ServerEvents.PLAYER_SESSION_END,
			],
			onPublish: (state) => {
				ComponentStore.setPlayerStatsAllTime(userId, cloneStats(state))
			},
		})

		allTimeState.set(userId, backed)

		backed.init().catch((error) => {
			console.error(`PlayerStatsTracker: getOrCreateAllTimeState: failed to hydrate for "${userId}"`, error)
		})

		return backed
	}


	// MARK: sessionStart
	/**
	 * Initializes per-session tracking and queues an all-time stats read for the player.
	 */
	export function sessionStart(userId: string): void {
		sessionStats.set(userId, createEmptyStats())
		gameStats.set(userId, createEmptyStats())
		publishStatsEntity(userId)
		getOrCreateAllTimeState(userId)
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

		getOrCreateAllTimeState(userId).update((state) => {
			const next = cloneStats(state)
			incrementRecord(next, stat, amount)
			return next
		})
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
		return cloneStats(allTimeState.get(userId)?.get() ?? createEmptyStats())
	}
}
