import { engine, Entity } from "@dcl/sdk/ecs"
import { isServer, syncEntity } from "@dcl/sdk/network"
import { AUTH_SERVER_PEER_ID } from "@dcl/sdk/network/message-bus-sync"

import { GameStatus } from "src/shared/enums"
import { GameSettings } from "src/shared/settings"

import * as C_GameData from "src/shared/components/gameData"
export * as C_GameData from "src/shared/components/gameData"

import * as C_PlayerFuel from "src/shared/components/playerFuel"
export * as C_PlayerFuel from "src/shared/components/playerFuel"

import * as C_Combo from "src/shared/components/combo"
export * as C_Combo from "src/shared/components/combo"

import * as C_Leaderboards from "src/shared/components/leaderboards"
export * as C_Leaderboards from "src/shared/components/leaderboards"

import * as C_MostWanted from "src/shared/components/mostWanted"
export * as C_MostWanted from "src/shared/components/mostWanted"

import * as C_PigeonCounter from "src/shared/components/pigeonCounter"
export * as C_PigeonCounter from "src/shared/components/pigeonCounter"

import * as C_PlayerStats from "src/shared/components/playerStats"
export * as C_PlayerStats from "src/shared/components/playerStats"

import * as C_SpectatorMode from "src/shared/components/spectatorMode"
export * as C_SpectatorMode from "src/shared/components/spectatorMode"

import { PlayerStatsRecord } from "src/shared/metrics/playerStats"

/**
 * Lifecycle-only namespace: creates the synced gameplay entity, registers it
 * with `syncEntity`/`validateBeforeChange`, and exposes lookup + readiness
 * helpers. Does not read or write component fields directly — that's
 * `ComponentStore`'s job. Keeping the two split makes the dependency direction
 * one-way (`ComponentStore` -> `ComponentManager`) and means the manager has no
 * domain knowledge of the data shape beyond what `gameData.ts` declare.
 */
export namespace ComponentManager {

	// MARK: Types
	type ComponentWithValidation = {
		validateBeforeChange: (
			entity: Entity,
			cb    : (value: { senderAddress: string }) => boolean
		) => void
	}


	// MARK: Vars
	const LANE_ENTITY_SYNC_ENUM_BASE = 1000
	const clientReadyResolvers       : Array<() => void>    = [] // Promise resolvers awaiting client-side discovery of all lane entities.
	const playerStatsEntities        = new Map<string, Entity>()
	let componentEntity              : (Entity | undefined) = undefined
	let isInitialised                : boolean              = false

/* 	const clientComponents = [
		C_PlayerFuel.PlayerFuel,
		C_Combo.Combo,
	] */

	const syncedComponents = [
		C_GameData.GameData,
		C_GameData.ScoreBoard,
		C_Leaderboards.leaderboardAllTime,
		C_Leaderboards.leaderboardWeekly,
		C_MostWanted.MostWanted,
	]

	const playerStatsComponents = [
		C_PlayerStats.PlayerStatsIdentity,
		C_PlayerStats.PlayerStatsPerGame,
		C_PlayerStats.PlayerStatsPerSession,
		C_PlayerStats.PlayerStatsAllTime,
	]


	// MARK: init
	export function init(): void {
		if (isInitialised) {
			console.log('ComponentManager: init: already initialised, skipping')
			return
		}
		isInitialised = true

		isServer() ? initServer() : initClient()
	}


	// MARK: initServer
	function initServer(): void {
		console.log('ComponentManager: initServer: creating component entity')

		const entity = engine.addEntity()
		componentEntity = entity

		seedComponentDefaults()

		const syncedComponentIds = Array.from(syncedComponents, (component) => component.componentId)
		syncEntity(entity, syncedComponentIds, LANE_ENTITY_SYNC_ENUM_BASE + 1)

		protectServerEntity(entity, syncedComponents)
	}


	// MARK: seedComponentDefaults
	export function seedComponentDefaults(): void {
		const entity = getComponentEntity()

		if (isServer()) {
			// Server
			C_GameData.GameData.createOrReplace(entity, {
				players  : [],
				startTime: 0,
				status   : GameStatus.IDLE,
			})
			C_GameData.ScoreBoard.createOrReplace(entity, {
				scores: [],
			})

			// Leaderboards
			const leaderboardAllTimeExists = C_Leaderboards.leaderboardAllTime.has(entity)
			if (!leaderboardAllTimeExists) {
				C_Leaderboards.leaderboardAllTime.createOrReplace(entity, { 
					scores: [] 
				})
			}
			const leaderboardWeeklyExists = C_Leaderboards.leaderboardWeekly.has(entity)
			if (!leaderboardWeeklyExists) {
				C_Leaderboards.leaderboardWeekly.createOrReplace(entity, { 
					scores: [] 
				})
			}

			const mostWantedExists = C_MostWanted.MostWanted.has(entity)
			if (!mostWantedExists) {
				C_MostWanted.MostWanted.createOrReplace(entity, {
					wantedForPigeons: "",
					wantedForMurder : "",
				})
			}

		} else {	
			// Client
			C_PlayerFuel.PlayerFuel.createOrReplace(entity, {	
				value: 100,
				maxValue: 100,
			})
			C_Combo.Combo.createOrReplace(entity, {
				value: 1,
				lastUpdatedTime: 0,
			})
			C_PigeonCounter.PigeonCounter.createOrReplace(entity, {
				status  : [false, false, false, false, false, false, false, false, false, false],
				count   : 0,
				maxCount: 10,
			})
			C_SpectatorMode.SpectatorMode.createOrReplace(entity, {
				enabled: false,
			})
		}
	}

	export function resetComponentAfterRound(): void {
		const entity = getComponentEntity()

		if (isServer()) {
			// Server
			const c_gameData = C_GameData.GameData.getMutableOrNull(entity)
			if (c_gameData === null) return

			c_gameData.startTime = 0
			C_GameData.ScoreBoard.createOrReplace(entity, {
				scores: [],
			})

		} else {	
			// Client
			C_PlayerFuel.PlayerFuel.createOrReplace(entity, {	
				value: 100,
				maxValue: 100,
			})
			C_Combo.Combo.createOrReplace(entity, {
				value: 1,
				lastUpdatedTime: 0,
			})
		}
	}


	// MARK: initClient
	// one-shot system that watches for the synced lane entities and stores them in `laneComponentEntities[]` 
	function initClient(): void {
		// MARK: create synced components
		console.log('ComponentManager: initClient: starting discovery watcher')
		const sys_watcher = (): void => {
			// Search for all entities with the GameData component
			for (const [entity, gameData] of engine.getEntitiesWith(C_GameData.GameData)) {
				if (componentEntity === undefined) {
					componentEntity = entity
					console.log('ComponentManager: initClient: discovered component entity: ')
				}
			}

			// If the component entity is found, remove the watcher and resolve the client ready promise
			if (componentEntity !== undefined) {
				engine.removeSystem(sys_watcher)
				
				// Add the clientComponentes
				seedComponentDefaults()

				const resolvers = clientReadyResolvers.splice(0)
				for (const resolve of resolvers) resolve()
				return
			}
		}
		engine.addSystem(sys_watcher)

		// MARK: create client components
		console.log('ComponentManager: initClient: creating local components')
	}


	// MARK: protectServerEntity
	function protectServerEntity(
		entity    : Entity,
		components: ComponentWithValidation[]
	): void {
		for (const component of components) {
			component.validateBeforeChange(entity, (value) => {
				return value.senderAddress === AUTH_SERVER_PEER_ID
			})
		}
	}


	// MARK: createPlayerStatsEntity
	/**
	 * Creates or updates the server-owned synced stats entity for a player.
	 */
	export function createPlayerStatsEntity(
		userId      : string,
		perGame    : PlayerStatsRecord,
		perSession : PlayerStatsRecord,
		allTime    : PlayerStatsRecord
	): Entity | undefined {
		if (!isServer()) return undefined

		const existingEntity = getPlayerStatsEntity(userId)
		const entity         = existingEntity ?? engine.addEntity()

		C_PlayerStats.PlayerStatsIdentity.createOrReplace(entity, {
			userId: userId,
		})
		C_PlayerStats.PlayerStatsPerGame.createOrReplace(entity, perGame)
		C_PlayerStats.PlayerStatsPerSession.createOrReplace(entity, perSession)
		C_PlayerStats.PlayerStatsAllTime.createOrReplace(entity, allTime)

		if (existingEntity === undefined) {
			const componentIds = Array.from(playerStatsComponents, (component) => component.componentId)
			syncEntity(entity, componentIds)
			protectServerEntity(entity, playerStatsComponents)
		}

		playerStatsEntities.set(userId, entity)
		return entity
	}


	// MARK: getPlayerStatsEntity
	/**
	 * Returns the synced stats entity for a player, if it has been created or discovered.
	 */
	export function getPlayerStatsEntity(userId: string): Entity | undefined {
		const knownEntity = playerStatsEntities.get(userId)
		if (knownEntity !== undefined) return knownEntity

		for (const [entity, identity] of engine.getEntitiesWith(C_PlayerStats.PlayerStatsIdentity)) {
			if (identity.userId === userId) {
				playerStatsEntities.set(userId, entity)
				return entity
			}
		}

		return undefined
	}


	// MARK: removePlayerStatsEntity
	/**
	 * Removes the server-owned synced stats entity for a player.
	 */
	export function removePlayerStatsEntity(userId: string): void {
		if (!isServer()) return

		const entity = getPlayerStatsEntity(userId)
		if (entity === undefined) return

		engine.removeEntity(entity)
		playerStatsEntities.delete(userId)
	}


	// MARK: onClientReady
	export function onClientReady(): Promise<void> {
		if (isServer() || isReady()) return Promise.resolve()

		return new Promise<void>((resolve) => {
			clientReadyResolvers.push(resolve)
		})
	}


	// MARK: isReady
	export function isReady(): boolean {
		return componentEntity !== undefined
	}


	// MARK: getComponentEntity
	/**
	 * Returns the synced gameplay entity. Throws if it does not exist yet (e.g. client before sync).
	 */
	export function getComponentEntity(): Entity {
		const entity = componentEntity
		if (entity === undefined) {
			throw new Error(`ComponentManager: getComponentEntity: entity not yet available`)
		}
		return entity
	}


	// MARK: tryGetComponentEntity
	/**
	 * Same entity as {@link getComponentEntity}, but returns undefined instead of throwing while the
	 * server has not created it or the client has not discovered it after sync.
	 */
	export function tryGetComponentEntity(): Entity | undefined {
		return componentEntity
	}
}
