import { Leaderboard, LeaderboardEntry } from "src/shared/classes/leaderboard"
import { ComponentStore } from "../components/componentStore"

export class LeaderboardWeekly extends Leaderboard {
	constructor() {
		super('weekly')
	}

	// MARK: cleanup
	/**
	 * Drops entries that were not set in the current week 
	 * Then calls super to sort and slice
	 */
	protected cleanup(entries: LeaderboardEntry[]): LeaderboardEntry[] {
		const currentWeek    = this.weekKey(Date.now())
		const thisWeekOnly   = entries.filter((entry) => this.weekKey(entry.lastUpdated) === currentWeek)

		return super.cleanup(thisWeekOnly)
	}


	// MARK: weekKey
	/**
	 * Returns a stable ISO 8601 week identifier ("<isoYear>-<week>") for a timestamp,
	 * so comparisons stay correct across month and year boundaries.
	 */
	private weekKey(timestamp: number): string {
		const target = new Date(Date.UTC(
			new Date(timestamp).getUTCFullYear(),
			new Date(timestamp).getUTCMonth(),
			new Date(timestamp).getUTCDate()
		))

		// Shift to the Thursday of this week (ISO weeks are defined by their Thursday)
		const dayOffset = (target.getUTCDay() + 6) % 7
		target.setUTCDate(target.getUTCDate() - dayOffset + 3)

		const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
		const firstOffset   = (firstThursday.getUTCDay() + 6) % 7
		firstThursday.setUTCDate(firstThursday.getUTCDate() - firstOffset + 3)

		const msPerWeek = 7 * 24 * 60 * 60 * 1000
		const week      = 1 + Math.round((target.getTime() - firstThursday.getTime()) / msPerWeek)

		return `${target.getUTCFullYear()}-${week}`
	}


	// MARK: callback
	/**
	 * Callback to be overridden by subclasses to perform additional actions when a score is submitted.
	 */
	protected callback(entries: LeaderboardEntry[]): void {
		console.log(`LeaderboardWeekly: submitScore: wrote "weekly"`, entries)

		// Tell the component store to update the weekly leaderboard, so that can 
		// be synced to the clients
		ComponentStore.setLeaderboardWeekly(entries)
	}
}
