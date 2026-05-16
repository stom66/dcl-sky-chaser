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
	let componentEntity              : (Entity | undefined) = undefined
	let isInitialised                : boolean              = false

	const clientComponents = [
		C_PlayerFuel.PlayerFuel,
		C_Combo.Combo,
	]

	const syncedComponents = [
		C_GameData.GameData,
		C_GameData.ScoreBoard,
	]

	const syncedComponentIds = Array.from(syncedComponents, (component) => component.componentId)


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

		syncEntity(entity, syncedComponentIds, LANE_ENTITY_SYNC_ENUM_BASE + 1)
		protectServerEntity(entity, syncedComponents)
	}


	// MARK: seedComponentDefaults
	export function seedComponentDefaults(): void {
		const entity = getComponentEntity()

		if (!isServer()) {
			// Client
			C_PlayerFuel.PlayerFuel.createOrReplace(entity, {	
				value: 100,
				maxValue: 100,
			})
			C_Combo.Combo.createOrReplace(entity, {
				value: 1,
				lastUpdatedTime: 0,
			})
		} else {	
			// Server
			C_GameData.GameData.createOrReplace(entity, {
				players  : [],
				startTime: Date.now(),
				status   : GameStatus.LOBBY,
			})
			C_GameData.ScoreBoard.createOrReplace(entity, {
				scores: [],
			})
		}
	}


	// MARK: initClient
	// one-shot system that watches for the synced lane entities and stores them in `laneComponentEntities[]` 
	function initClient(): void {
		// MARK: create synced components
		console.log('ComponentManager: initClient: starting discovery watcher')
		const watcher = (): void => {
			// Search for all entities with the GameData component
			for (const [entity, gameData] of engine.getEntitiesWith(C_GameData.GameData)) {
				if (componentEntity === undefined) {
					componentEntity = entity
					console.log('ComponentManager: initClient: discovered component entity: ')
				}
			}

			// If the component entity is found, remove the watcher and resolve the client ready promise
			if (componentEntity !== undefined) {
				engine.removeSystem(watcher)
				
				// Add the clientComponentes
				seedComponentDefaults()

				const resolvers = clientReadyResolvers.splice(0)
				for (const resolve of resolvers) resolve()
				return
			}
		}
		engine.addSystem(watcher)

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
