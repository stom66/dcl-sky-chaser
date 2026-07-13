import { Leaderboard, LeaderboardEntry, LeaderboardScore } from "src/shared/classes/leaderboard"
import { LeaderboardAllTime } from "src/shared/classes/leaderboard.allTime"
import { LeaderboardWeekly } from "src/shared/classes/leaderboard.weekly"

export namespace LeaderboardManager {

	const leaderboards: { [key: string]: Leaderboard } = {}

	export function init() {
		leaderboards.alltime = new LeaderboardAllTime()
		leaderboards.weekly  = new LeaderboardWeekly()
	}

	export async function submitScores(
		boardName: string,
		scores   : LeaderboardScore[]
	): Promise<void> {
		await leaderboards[boardName].submitScores(scores)
	}


	export async function getLeaderboardAllTime(): Promise<LeaderboardEntry[]> {
		return await leaderboards.alltime.read()
	}

	export async function getLeaderboardWeekly(): Promise<LeaderboardEntry[]> {
		return await leaderboards.weekly.read()
	}
}
