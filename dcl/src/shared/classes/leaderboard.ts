import { Storage } from "@dcl/sdk/server"

import { userProfileCache } from "src/shared/utils/userProfileCache"

export type LeaderboardEntry = {
	userId     : string
	displayName: string
	score      : number
	lastUpdated: number
	rank       : number
}

export class Leaderboard {
	protected storeName  : string
	protected recordLimit: number = 10
	private submissionQueue: Promise<void> = Promise.resolve()

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


	// MARK: submitScore
	/**
	 * Reads the latest data, applies the score if shouldReplace allows it, then writes
	 * the cleaned result back so storage never grows beyond recordLimit or keeps dead entries.
	 */
	public async submitScore(
		userId: string,
		score : number
	): Promise<void> {
		const submission = this.submissionQueue.then(() => this.submitScoreQueued(userId, score))
		this.submissionQueue = submission.catch(() => undefined)

		return submission
	}


	// MARK: submitScoreQueued
	/**
	 * Applies one score update after any previous update for this leaderboard has
	 * finished, preventing overlapping storage reads from overwriting each other.
	 */
	private async submitScoreQueued(
		userId: string,
		score : number
	): Promise<void> {
		const entries     = await this.read()
		const existing    = entries.find((e) => e.userId === userId)
		const displayName = await userProfileCache.getUserDisplayName(userId)

		if (entries.length === 0 && this.shouldRejectEmptyReadWrite()) {
			console.error(`Leaderboard: submitScoreQueued: refusing to write "${this.storeName}" after empty read`)
			return
		}

		if (existing) {
			if (!this.shouldReplace(existing, score)) return
			existing.score       = score
			existing.displayName = displayName
			existing.lastUpdated = Date.now()
		} else {
			entries.push({
				userId     : userId,
				displayName: displayName,
				score      : score,
				lastUpdated: Date.now(),
				rank       : 0
			})
		}

		try {
			const cleaned = this.cleanup(entries)
			await Storage.set(this.storeName, JSON.stringify(cleaned))
			console.log(`Leaderboard: submitScore: wrote "${this.storeName}"`, cleaned)
			this.callback(cleaned)
		} catch (error) {
			console.error(`Leaderboard: submitScore: failed to write "${this.storeName}"`, error)
		}
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


	// MARK: shouldRejectEmptyReadWrite
	/**
	 * Whether a leaderboard should reject writes when its storage read returns
	 * no entries. Useful for persistent boards where an empty read indicates
	 * missing storage rather than a valid reset state.
	 */
	protected shouldRejectEmptyReadWrite(): boolean {
		return false
	}
}
