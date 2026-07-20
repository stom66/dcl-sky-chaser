import { Storage } from "@dcl/sdk/server"
import * as utils from "@dcl-sdk/utils"


import { userProfileCache } from "src/shared/utils/userProfileCache"

export type LeaderboardEntry = {
	userId     : string
	displayName: string
	score      : number
	lastUpdated: number
	rank       : number
}

export type LeaderboardScore = {
	userId         : string
	score          : number
	isNewHighscore?: boolean
}

export class Leaderboard {
	protected storeName  : string
	protected recordLimit: number  = 10
	private isBusy       : boolean = false

	constructor(storeName: string) {
		this.storeName = storeName

		this.read().then((entries) => {
			this.callback(entries)
		})
	}


	// MARK: read
	/**
	 * Reads entries from storage, clean them up, remove stale entries, sorted high
	 * to low, and capped to recordLimit.
	 */
	public async read(): Promise<LeaderboardEntry[]> {
		const raw = await Storage.get<string>(this.storeName)
		if (!raw) return []

		try {
			const entries = JSON.parse(raw) as LeaderboardEntry[]
			const cleaned = this.cleanup(entries)
			return cleaned
		} catch (error) {
			console.error(`Leaderboard: read: failed to parse "${this.storeName}"`, error)
			return []
		}
	}


	// MARK: submitScores
	/**
	 * Reads the latest data, applies each score if shouldReplace allows it, then
	 * writes the cleaned result back in one storage update.
	 */
	public async submitScores(
		scores: LeaderboardScore[]
	): Promise<void> {
		if (scores.length === 0) return

		await this.waitForTurn()

		try {
			await this.submitScoresBusy(scores)
		} finally {
			this.isBusy = false
		}
	}


	// MARK: submitScoresBusy
	/**
	 * Applies score updates while the leaderboard is locked for writing.
	 */
	private async submitScoresBusy(
		scores: LeaderboardScore[]
	): Promise<void> {
		const entries = await this.read()

		for (const score of scores) {
			await this.applyScore(entries, score)
		}

		try {
			const cleaned = this.cleanup(entries)
			await Storage.set(this.storeName, JSON.stringify(cleaned))
			console.log(`Leaderboard: submitScores: wrote "${this.storeName}"`, cleaned)
			this.callback(cleaned)
		} catch (error) {
			console.error(`Leaderboard: submitScores: failed to write "${this.storeName}"`, error)
		}
	}


	// MARK: applyScore
	/**
	 * Applies one incoming score to the in-memory leaderboard entries.
	 */
	private async applyScore(
		entries: LeaderboardEntry[],
		score  : LeaderboardScore
	): Promise<void> {
		const existing    = entries.find((e) => e.userId === score.userId)
		const displayName = await userProfileCache.getUserDisplayName(score.userId)

		if (existing) {
			if (!this.shouldReplace(existing, score.score)) return

			existing.score       = score.score
			existing.displayName = displayName
			existing.lastUpdated = Date.now()
			return
		}

		entries.push({
			userId     : score.userId,
			displayName: displayName,
			score      : score.score,
			lastUpdated: Date.now(),
			rank       : 0
		})
	}


	// MARK: waitForTurn
	/**
	 * Waits until no write is active, then marks this leaderboard as busy.
	 */
	private async waitForTurn(): Promise<void> {
		while (this.isBusy) {
			await this.wait(10)
		}

		this.isBusy = true
	}


	// MARK: wait
	/**
	 * Resolves after the requested delay.
	 */
	private async wait(ms: number): Promise<void> {
		return new Promise((resolve) => {
			utils.timers.setTimeout(resolve, ms)
		})
	}

	// MARK: callback
	/**
	 * Callback to be overridden by subclasses to perform additional actions when a score is 
	 * submitted or data is read.
	 */
	protected callback(entries: LeaderboardEntry[]): void {
		console.log(`Leaderboard: submitScore: wrote "${this.storeName}"`, entries)
	}


	// MARK: cleanup
	/**
	 * Sorts entries high to low and caps to recordLimit. Run on every read and write
	 * so storage stays bounded. Override wholesale for boards with extra requirements
	 * (eg weekly dropping entries from previous weeks).
	 */
	protected cleanup(entries: LeaderboardEntry[]): LeaderboardEntry[] {
		return entries
			.sort((a, b) => b.score - a.score)
			.slice(0, this.recordLimit)
			.map((entry, index) => ({ ...entry, rank: index + 1 }))
	}


	// MARK: shouldReplace
	/**
	 * Whether an incoming score should replace the stored entry. Defaults to keeping
	 * the player's best score.
	 */
	protected shouldReplace(
		existing: LeaderboardEntry,
		score   : number
	): boolean {
		return score > existing.score
	}
}
