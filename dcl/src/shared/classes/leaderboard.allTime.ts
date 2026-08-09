import { Leaderboard, LeaderboardEntry } from "src/shared/classes/leaderboard"
import { ComponentStore } from "src/shared/components/componentStore"

/**
 * All-time leaderboard. Uses the base behaviour as-is: a score is only ever
 * replaced when it beats the player's stored best.
 */
export class LeaderboardAllTime extends Leaderboard {
	constructor() {
		super('alltime')
	}

	protected callback(entries: LeaderboardEntry[]): void {
		console.log(`LeaderboardAllTime: submitScore: wrote "alltime"`, entries)
		ComponentStore.setLeaderboardAllTime(entries)
	}
}
