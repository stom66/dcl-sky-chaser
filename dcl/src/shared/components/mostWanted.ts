import { engine, Schemas } from "@dcl/sdk/ecs"


export type MostWantedState = {
	wantedForPigeons: string
	wantedForMurder : string
}


// MARK: Component Schema
const mostWantedSchema = {
	wantedForPigeons: Schemas.String,
	wantedForMurder : Schemas.String,
}

export const MostWanted = engine.defineComponent(
	'MostWanted',
	mostWantedSchema
)


// MARK: createEmptyMostWanted
/**
 * Returns the default empty MostWanted state.
 */
export function createEmptyMostWanted(): MostWantedState {
	return {
		wantedForPigeons: "",
		wantedForMurder : "",
	}
}


// MARK: normalizeMostWanted
/**
 * Normalizes a partial MostWanted record into a full typed state.
 */
export function normalizeMostWanted(raw: Partial<MostWantedState> | null | undefined): MostWantedState {
	return {
		wantedForPigeons: typeof raw?.wantedForPigeons === "string" ? raw.wantedForPigeons : "",
		wantedForMurder : typeof raw?.wantedForMurder  === "string" ? raw.wantedForMurder  : "",
	}
}
