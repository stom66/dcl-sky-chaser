import { getPlayer } from '@dcl/sdk/players'


// MARK: Type
export type ClientState = {
	userId        : string
	displayName   : string
}

// MARK: ClientStore
export class ClientStore {
	private static instance: ClientStore | undefined

	private readonly clientState: ClientState = {
		userId           : "",
		displayName      : ""
	}
	
	private constructor() {
		console.log('ClientStore: constructor')
	}


	// MARK: Init
	async init(): Promise<void> {
		let userData = getPlayer()
		if (!userData) {
			console.error('ClientStore: init: failed - userData not found')
			return
		}
		this.setUserId(userData.userId)
		this.setDisplayName(userData.name)

		console.log('ClientStore: init(): success. userId:', this.getUserId(), 'displayName:', this.getDisplayName())
	}


	// MARK: Instance
	static getInstance(): ClientStore {
		if (!ClientStore.instance) ClientStore.instance = new ClientStore()
		return ClientStore.instance
	}


	// MARK: Getters/Setters

	setUserId(value: string) {
		this.clientState.userId = value
	}
		getUserId(): string {
			return this.clientState.userId
		}

	setDisplayName(value: string) {
		this.clientState.displayName = value
	}
		getDisplayName(): string {
			return this.clientState.displayName
		}
}
