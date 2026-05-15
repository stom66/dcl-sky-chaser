import { GameStatus } from "src/shared/enums"


// MARK: NotifyServerTimePayload
export type NotifyServerTimePayload = {
	sentAt : number
}


// MARK: GameDataSnapshot
export type GameDataSnapshot = {
	players  : string[]
	startTime: number
	status   : GameStatus
}
