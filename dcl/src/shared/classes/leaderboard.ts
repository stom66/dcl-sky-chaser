import { Storage } from "@dcl/sdk/server"
import { userProfileCache } from "../utils/userProfileCache"

export type LeaderboardData = {
	userId     : string
	displayName: string
	score      : number
	rank       : number
	lastUpdated: number
}

export class Leaderboard {
	private data         : LeaderboardData[] = []
	private dataStoreName: string
	private lastFetched  : number            = 0
	private maxDataAge   : number            = 1000 * 60 * 1 // 1 minute
	private recordLimit  : number            = 10 // Max number of records to return

	constructor(dataStoreName: string) {
		this.dataStoreName = dataStoreName

		this.updateData()
	}

	private async updateData(): Promise<LeaderboardData[]> {
		const data = await this.readDataFromStorage()

		this.data = data
		this.lastFetched = Date.now()

		// Sort and clean on fetch
		this.sortData()
		this.cleanData()

		return this.data
	}

	private async readDataFromStorage(): Promise<LeaderboardData[]> {		
		try {
			const data = await Storage.get<string>(this.dataStoreName)
			if (data) {
				try {
					return JSON.parse(data) as LeaderboardData[]
				} catch (parseError) {
					console.error('Leaderboard: fetchStoredLeaderboard: failed to parse leaderboard data', parseError)
					return []
				}
			}
			return []
		} catch (error) {
			console.error('Leaderboard: fetchStoredLeaderboard: error fetching from storage', error)
			return []
		}
	}

	public getData(): LeaderboardData[] {
		if (Date.now() - this.lastFetched > this.maxDataAge) {
			this.updateData()
		}

		return this.data.slice(0, this.recordLimit)
	}

	public updateScore(
		userId: string, 
		score : number
	): void {

		this.updateData()

		const index = this.data.findIndex((l) => l.userId === userId)
		if (index !== -1) {
			if (this.data[index].score < score) {
				this.data[index].score = score
				this.data[index].lastUpdated = Date.now()
			}
		} else {
			this.data.push({ 
				userId     : userId, 
				displayName: userProfileCache.getDisplayName(userId), 
				score, 
				rank: this.data.length + 1, lastUpdated: Date.now() 
			})
		}

		// Sort and clean the data after every modification
		this.sortData()
		this.cleanData()

		// Write it back to the data store
		Storage.set(this.dataStoreName, JSON.stringify(this.data))
			.then(() => {
				console.log('Leaderboard: updateScore: data written to storage')
			})
			.catch((error) => {
				console.error('Leaderboard: updateScore: error writing to storage', error)
			})
	}

	private sortData(): void {
		this.data.sort((a, b) => b.score - a.score)
	}

	private cleanData(): void {
		this.data = this.data.slice(0, this.recordLimit)
	}
}