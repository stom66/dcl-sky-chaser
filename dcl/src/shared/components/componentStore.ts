import { isServer } from "@dcl/sdk/network"
import { ComponentData, Entity } from "@dcl/sdk/ecs"

import { GameStatus } from "src/shared/enums"
import { GameDataSnapshot } from "src/shared/types/shared-types"

import { ComponentManager, C_GameData, C_FooBar } from "src/shared/components/componentManager"

// Re-export Components for easy importing elsewhere
export * as C_FooBar from "src/shared/components/fooBar"
export * as C_GameData from "src/shared/components/gameData"


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
		C_GameData.GameData,
		C_GameData.ScoreBoard,
		C_FooBar.FooBar,
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
	export function getGameSnapshot(laneIndex: number): GameDataSnapshot {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) {
			return {
				players  : [],
				startTime: 0,
				status   : GameStatus.LOBBY,
			}
		}

		const gameData = C_GameData.GameData.get(entity)

		return {
			players  : gameData?.players ?? [],
			startTime: gameData?.startTime ?? 0,
			status   : gameData?.status ?? GameStatus.LOBBY,
		}
	}


	// MARK: resetLane
	export function resetAllComponents(laneIndex: number): void {
		if (!isServer()) return

		ComponentManager.seedComponentDefaults()
	}

	// MARK: GameStartTime
	export function getGameStartTime(laneIndex: number): number {
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

		const c = C_GameData.GameData.getMutable(entity)
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

		const c = C_GameData.GameData.getMutable(entity)
		c.players = players
	}

	export function addPlayer(userId: string): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_GameData.GameData.getMutable(entity)
		const prior = c.players ?? []
		if (prior.includes(userId)) return

		// Reassign rather than push so the component definitely marks dirty for sync.
		c.players = [...prior, userId]
	}

	export function removePlayer(userId: string): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_GameData.GameData.getMutable(entity)
		c.players = (c.players ?? []).filter((p) => p !== userId)

		// TODO: may needs checks in here, to abort a game if no players are left
	}


	// MARK: FooBar
	export function getFooBar(): {
		foo: string,
		bar: number
	} {
		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) {
			console.log('getFooBar: entity is undefined')
			return { foo: 'n/a', bar: 0 }
		}

		const c = C_FooBar.FooBar.get(entity)
		const rawBar = c?.bar ?? 0
		return {
			foo: c?.foo ?? '',
			bar: typeof rawBar === "number" && Number.isFinite(rawBar) ? rawBar : 0,
		}
	}

	export function setFooBar(
		foo: string,
		bar: number
	): void {
		if (!isServer()) return

		const entity = ComponentManager.tryGetComponentEntity()
		if (entity === undefined) return

		const c = C_FooBar.FooBar.getMutable(entity)
		c.foo = foo
		c.bar = bar
	}

}
