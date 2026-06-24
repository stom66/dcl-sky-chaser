import { isServer } from "@dcl/sdk/network"
import { ComponentData, Entity } from "@dcl/sdk/ecs"

import { GameStatus } from "src/shared/enums"
import { GameDataSnapshot } from "src/shared/types/shared-types"

import { ComponentManager, C_GameData, C_PlayerFuel, C_Combo, C_Leaderboards, C_PigeonCounter } from "src/shared/components/componentManager"
import { GameSettings } from "src/shared/settings"
import { LeaderboardEntry } from "src/shared/classes/leaderboard"
import { ClientEvents, eventBus } from "../utils/eventBus"

// Re-export Components for easy importing elsewhere
export * as C_GameData from "src/shared/components/gameData"
export * as C_PlayerFuel from "src/shared/components/playerFuel"
export * as C_Combo from "src/shared/components/combo"
export * as C_Leaderboards from "src/shared/components/leaderboards"
export * as C_PigeonCounter from "src/shared/components/pigeonCounter"
/**
 * Data-access wrapper around the synced components. Reads work on both
 * server and client; writes are gated by `isServer()` and silently no-op on
 * the client (the server is authoritative). All entity lookup goes through
 * `ComponentManager`.
 *
 * Reads never throw for an uninitialized entity: they return empty defaults until
 * `ComponentManager.isReady()` is true. Writes no-op until the entity exists.
 * 
 * You can listen to changes on a component by calling `onComponentChange`.
 */

type ComponentListener<T> = (data: T | undefined) => void
type AnyComponent<T>      = {
	componentId: number

	onChange(
		entity: Entity,
		cb: (value: T | undefined) => void
	): void
}

export namespace ComponentStore {

	const components = [
		C_Combo.Combo,
		C_GameData.GameData,
		C_GameData.ScoreBoard,
		C_PlayerFuel.PlayerFuel,
		C_Leaderboards.leaderboardAllTime,
		C_Leaderboards.leaderboardWeekly,
		C_PigeonCounter.PigeonCounter,
	] as const

	const watchers = new Map<
		AnyComponent<any>, 
		Set<ComponentListener<any>>
	>()

	let isInitialized = false


	// MARK: init
	export function init(): void {
		const entity = ComponentManager.getComponentEntity()
		for (const component of components) {
			component.onChange(entity, (current) => {
				emitOnChange(component, current)
			})
		}

		isInitialized = true
	}


	// MARK: emitOnChange
	function emitOnChange(
		component: AnyComponent<any>,
		data: unknown
	): void {
	
		const listeners = watchers.get(component)
	
		if (!listeners) return
	
		for (const callback of listeners) {
			callback(data)
		}
	}

	export function onComponentChange<T>(
		component: AnyComponent<T>,
		listener: ComponentListener<T>
	): () => void {

		if (!watchers.has(component)) {
			watchers.set(component, new Set())
		}

		const listeners = watchers.get(component)!

		listeners.add(listener)

		return () => {
			listeners.delete(listener)
		}
	}

	// MARK: getGameSnapshot
	export function getGameSnapshot(): GameDataSnapshot {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) {
			return {
				players  : [],
				startTime: 0,
				status   : GameStatus.IDLE,
			}
		}

		const gameData = C_GameData.GameData.get(entity)

		return {
			players  : gameData?.players ?? [],
			startTime: gameData?.startTime ?? 0,
			status   : gameData?.status ?? GameStatus.IDLE,
		}
	}


	// MARK: resetAllComponents
	export function resetAfterRound(): void {
		if (!isServer()) return

		ComponentManager.seedComponentDefaults()
	}


	// MARK: GameStatus
	export function getGameStatus(): GameStatus {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return GameStatus.IDLE

		const c = C_GameData.GameData.get(entity)
		return c?.status ?? GameStatus.IDLE
	}
	export function setGameStatus(status: GameStatus): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_GameData.GameData.getMutableOrNull(entity)
		if (c === null) return

		c.status = status
	}
	

	// MARK: GameStartTime
	export function getGameStartTime(): number {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return 0

		const c = C_GameData.GameData.get(entity)
		return c?.startTime ?? 0
	}

	export function setGameStartTime(
		startTime: number
	): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_GameData.GameData.getMutableOrNull(entity)
		if (c === null) return

		c.startTime = startTime
	}


	// MARK: Players
	export function getPlayers(): string[] {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return []

		const c = C_GameData.GameData.get(entity)
		return c?.players ?? []
	}

	export function setPlayers(players: string[]): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_GameData.GameData.getMutableOrNull(entity)
		if (c === null) return

		c.players = players
	}

	export function addPlayer(userId: string): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_GameData.GameData.getMutableOrNull(entity)
		if (c === null) return

		const prior = c.players ?? []
		if (prior.includes(userId)) return

		// Reassign rather than push so the component definitely marks dirty for sync.
		c.players = [...prior, userId]
	}

	export function removePlayer(userId: string): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_GameData.GameData.getMutableOrNull(entity)
		if (c === null) return

		c.players = (c.players ?? []).filter((p) => p !== userId)

		// TODO: may needs checks in here, to abort a game if no players are left
	}



	// MARK: Scoreboard
	export function incrementPlayerScore(
		userId: string,
		amount: number = 1
	): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_GameData.ScoreBoard.getMutableOrNull(entity)
		if (c === null) return

		// Ensure the player exists in the scoreboard
		const player = c.scores?.find((s) => s.userId === userId)
		if (player) {
			console.log('incrementPlayerScore: player found, incrementing score', player.score, amount)
			player.score += amount
		} else {
			console.log('incrementPlayerScore: player not found, adding to scoreboard', userId, amount)
			c.scores = [...(c.scores ?? []), { userId, score: amount }]
		}
	}

	export function getPlayerScores(): { userId: string, score: number }[] {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return []

		const c = C_GameData.ScoreBoard.get(entity)

		const scores = [...(c?.scores ?? [])]
		scores.sort((a, b) => b.score - a.score)
		
		return scores
	}


	// MARK: Fuel
	export function getFuelValue(): {
		value   : number,
		maxValue: number
	} {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) {
			console.log('getFuelValue: entity is undefined')
			return { value: 0, maxValue: 0 }
		}

		const c = C_PlayerFuel.PlayerFuel.get(entity)
		return {
			value: c?.value ?? 0,
			maxValue: c?.maxValue ?? 100,
		}
	}
	export function resetFuelValue(): void {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) {
			console.log('getFuelValue: entity is undefined')
			return
		}

		const c = C_PlayerFuel.PlayerFuel.getMutableOrNull(entity)
		if (c === null) return

		c.value = c.maxValue
		console.log('resetFuelValue: fuel value reset to', c.value)
	}

	export function decreaseFuelValue(amount: number): void {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_PlayerFuel.PlayerFuel.getMutableOrNull(entity)
		if (c === null) return

		c.value -= amount
	}

	export function increaseFuelValue(amount: number): void {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_PlayerFuel.PlayerFuel.getMutableOrNull(entity)
		if (c === null) return

		c.value += amount
	}



	// MARK: Combo
	export function getComboValue(): number {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return 0

		const c = C_Combo.Combo.get(entity)
		return c?.value ?? 1
	}
	export function getComboLastUpdatedTime(): number {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return 0

		const c = C_Combo.Combo.get(entity)
		return c?.lastUpdatedTime ?? 0
	}

	export function incrementComboValue(): void {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_Combo.Combo.get(entity)
		if (c === undefined) return
		
		const cm = C_Combo.Combo.getMutable(entity)
		cm.lastUpdatedTime = Date.now()

		if (c.value >= GameSettings.COMBO_MAX_VALUE) return
		cm.value += 1
		
		console.log("incrementComboValue: combo value incremented to", cm.value)
	}

	export function decrementComboValue(): void {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_Combo.Combo.get(entity)
		if (c === undefined) return
		if (c.value <= 1) return

		const cm = C_Combo.Combo.getMutableOrNull(entity)
		if (cm === null) return

		cm.value -= 1
		cm.lastUpdatedTime = Date.now()
	}

	export function resetComboValue(): void {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_Combo.Combo.getMutableOrNull(entity)
		if (c === null) return

		c.value = 1
		c.lastUpdatedTime = 0
	}


	// MARK: Leaderboards
	export function setLeaderboardAllTime(leaderboard: LeaderboardEntry[]): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_Leaderboards.leaderboardAllTime.getMutableOrNull(entity)
		if (c === null) return

		c.scores = leaderboard
	}

	export function setLeaderboardWeekly(leaderboard: LeaderboardEntry[]): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_Leaderboards.leaderboardWeekly.getMutableOrNull(entity)
		if (c === null) return

		c.scores = leaderboard
	}

	export function getLeaderboardAllTime(): Omit<LeaderboardEntry, 'lastUpdated'>[] {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return []

		const c = C_Leaderboards.leaderboardAllTime.get(entity)
		return [...(c?.scores ?? [])]
	}

	export function getLeaderboardWeekly(): Omit<LeaderboardEntry, 'lastUpdated'>[] {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return []

		const c = C_Leaderboards.leaderboardWeekly.get(entity)
		return [...(c?.scores ?? [])]
	}
	

	// MARK: Pigeon Counter - Client only
	export function setPigeonMaxCount(numPigeons: number): void {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_PigeonCounter.PigeonCounter.getMutableOrNull(entity)
		if (c === null) return

		c.count    = 0
		c.maxCount = numPigeons
		c.status   = Array(numPigeons).fill(false)
	}

	export function resetPigeonCounter(): void {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_PigeonCounter.PigeonCounter.getMutableOrNull(entity)
		if (c === null) return

		c.status = Array(c.maxCount).fill(false)
		c.count  = 0
	}

	export function foundPigeon(index: number): void {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_PigeonCounter.PigeonCounter.getMutableOrNull(entity)
		if (c === null) return

		c.status[index] = true
		
		// count how many of the status values are "true"
		c.count = c.status.filter((status) => status).length
		console.log("foundPigeon: pigeon found", index, "count is now", c.count)

		if (c.count === c.maxCount) {
			eventBus.emit(ClientEvents.FOUND_ALL_PIGEONS, {})
			console.log("foundPigeon: all pigeons found")
		}
	}
}
