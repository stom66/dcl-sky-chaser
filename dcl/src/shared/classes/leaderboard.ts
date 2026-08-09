import { ServerBackedState } from "src/shared/storage/serverBackedState"
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
	protected recordLimit: number = 10

	private readonly backed: ServerBackedState<LeaderboardEntry[]>
	private readonly ready : Promise<void>


	constructor(storeName: string) {
		this.storeName = storeName

		this.backed = new ServerBackedState<LeaderboardEntry[]>({
			key          : storeName,
			createDefault: () => [],
			normalize    : (raw) => {
				const entries = Array.isArray(raw) ? raw as LeaderboardEntry[] : []
				return this.cleanup(entries)
			},
			onPublish: (entries) => {
				this.callback(entries)
			},
		})

		this.ready = this.backed.init().catch((error) => {
			console.error(`Leaderboard: constructor: failed to hydrate "${this.storeName}"`, error)
		})
	}


	// MARK: read
	/**
	 * Returns the current in-memory leaderboard entries after initial hydration.
	 */
	public async read(): Promise<LeaderboardEntry[]> {
		await this.ready
		return this.backed.get()
	}


	// MARK: submitScores
	/**
	 * Applies each score if shouldReplace allows it, then writes the cleaned
	 * result back in one queued storage update.
	 */
	public async submitScores(
		scores: LeaderboardScore[]
	): Promise<void> {
		if (scores.length === 0) return

		await this.backed.updateAsync(async (entries) => {
			const next = [...entries]

			for (const score of scores) {
				await this.applyScore(next, score)
			}

			return next
		})
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


	// MARK: callback
	/**
	 * Callback to be overridden by subclasses to perform additional actions when a score is
	 * submitted or data is read.
	 */
	protected callback(entries: LeaderboardEntry[]): void {
		console.log(`Leaderboard: callback: wrote "${this.storeName}"`, entries)
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
