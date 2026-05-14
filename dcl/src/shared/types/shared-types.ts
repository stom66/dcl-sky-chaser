import { GameStatus } from "src/shared/enums"


// MARK: NotifyServerTimePayload
export type NotifyServerTimePayload = {
	sentAt : number
}


// MARK: FooBarSnapshot
export type FooBarSnapshot = {
	foo: string
	bar: number
}


// MARK: NotifyFooBarPayload
/** Server → client: authoritative FooBar snapshot after a successful update. */
export type NotifyFooBarPayload = FooBarSnapshot


// MARK: RequestFooPayload
export type RequestFooPayload = {
	foo: number
}


// MARK: GameDataSnapshot
export type GameDataSnapshot = {
	players  : string[]
	startTime: number
	status   : GameStatus
}
