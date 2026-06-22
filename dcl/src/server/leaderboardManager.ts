import { Leaderboard, LeaderboardEntry } from "src/shared/classes/leaderboard";
import { LeaderboardAllTime } from "src/shared/classes/leaderboard.allTime";
import { LeaderboardWeekly } from "src/shared/classes/leaderboard.weekly";

export namespace LeaderboardManager {

	const leaderboards: { [key: string]: Leaderboard } = {}

	export function init() {
		leaderboards.alltime = new LeaderboardAllTime()
		leaderboards.weekly  = new LeaderboardWeekly()
	}

	export function submitScore(
		boardName: string,
		userId   : string,
		score    : number
	) {
		leaderboards[boardName].submitScore(userId, score)
	}


	export async function getLeaderboardAllTime(): Promise<LeaderboardEntry[]> {
		return await leaderboards.alltime.read()
	}

	export async function getLeaderboardWeekly(): Promise<LeaderboardEntry[]> {
		return await leaderboards.weekly.read()
	}
}
