// MARK: Type
export type ServerState = {
	players: string[]
}

// MARK: ServerStore
export class ServerStore {
	private static instance     : ServerStore | undefined
	private readonly serverState: ServerState = {
		players: [],
	}

	private constructor() { }

	
	// MARK: Instance
	static getInstance(): ServerStore {
		if (!ServerStore.instance) ServerStore.instance = new ServerStore()
		return ServerStore.instance
	}


	// MARK: State
	getState(): Readonly<ServerState> {
		return this.serverState
	}

	resetState(): void {
		this.serverState.players = []
	}


	// MARK: Players
	addPlayer(userId: string, displayName: string): void {
		console.log(`serverStore: addPlayer: userId ${userId} / displayName ${displayName}`)
		
		if (this.serverState.players.indexOf(userId) !== -1) {
			console.log(`serverStore: addPlayer: userId ${userId} is already present in players array.`)
			return
		}

		this.serverState.players.push(userId)
	}

	removePlayer(userId: string): void {
		if (this.serverState.players.indexOf(userId) === -1) {
			console.log(`serverStore: removePlayer: userId ${userId} is not present in players map.`)
			return
		}
		console.log(`serverStore: removePlayer: userId ${userId}`)
		this.serverState.players = this.serverState.players.filter((player) => player !== userId)
	}

}
