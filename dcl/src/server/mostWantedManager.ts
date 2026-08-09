import { ComponentStore } from "src/shared/components/componentStore"
import {
	createEmptyMostWanted,
	MostWantedState,
	normalizeMostWanted,
} from "src/shared/components/mostWanted"
import { ServerBackedState } from "src/shared/storage/serverBackedState"


export namespace MostWantedManager {

	const storageKey = "mostWanted"

	let backedState: ServerBackedState<MostWantedState> | undefined


	// MARK: init
	/**
	 * Hydrates MostWanted from scene storage and publishes into the synced component.
	 */
	export function init(): void {
		backedState = new ServerBackedState<MostWantedState>({
			key          : storageKey,
			createDefault: createEmptyMostWanted,
			normalize    : (raw) => normalizeMostWanted(raw as Partial<MostWantedState> | null | undefined),
			onPublish    : (state) => {
				ComponentStore.setMostWanted(state)
			},
		})

		backedState.init().catch((error) => {
			console.error("MostWantedManager: init: failed to hydrate", error)
		})
	}


	// MARK: getMostWanted
	/**
	 * Returns the current in-memory MostWanted state.
	 */
	export function getMostWanted(): MostWantedState {
		return backedState?.get() ?? createEmptyMostWanted()
	}


	// MARK: setWantedForPigeons
	/**
	 * Persists and syncs the most recent user who found all pigeons.
	 */
	export function setWantedForPigeons(userId: string): void {
		if (!backedState) {
			console.error("MostWantedManager: setWantedForPigeons: not initialised")
			return
		}

		backedState.update((state) => ({
			...state,
			wantedForPigeons: userId,
		}))
	}


	// MARK: setWantedForMurder
	/**
	 * Persists and syncs the most recent user wanted for murder.
	 */
	export function setWantedForMurder(userId: string): void {
		if (!backedState) {
			console.error("MostWantedManager: setWantedForMurder: not initialised")
			return
		}

		backedState.update((state) => ({
			...state,
			wantedForMurder: userId,
		}))
	}
}
