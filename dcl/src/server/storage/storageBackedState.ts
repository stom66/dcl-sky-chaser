import { Storage } from "@dcl/sdk/server"


export type StorageBackedStateOptions<T extends object> = {
	key          : string
	createDefault: () => T
	normalize    : (raw: Partial<T> | null | undefined) => T
	onPublish    : (state: T) => void
}


/**
 * Server-only helper for small scene-wide JSON storage keys.
 * Hydrates on init, queues writes, and publishes state through a callback.
 */
export class StorageBackedState<T extends object> {

	private readonly key          : string
	private readonly createDefault: () => T
	private readonly normalize    : (raw: Partial<T> | null | undefined) => T
	private readonly onPublish    : (state: T) => void

	private state     : T
	private writeQueue: Promise<void> = Promise.resolve()
	private isReady   : boolean       = false


	constructor(options: StorageBackedStateOptions<T>) {
		this.key           = options.key
		this.createDefault = options.createDefault
		this.normalize     = options.normalize
		this.onPublish     = options.onPublish
		this.state          = this.createDefault()
	}


	// MARK: init
	/**
	 * Loads the storage key, normalizes the result, and publishes it.
	 */
	public async init(): Promise<void> {
		const state = await this.read()
		this.state   = state
		this.isReady = true
		this.publish()
	}


	// MARK: get
	/**
	 * Returns the current in-memory state.
	 */
	public get(): T {
		return this.state
	}


	// MARK: update
	/**
	 * Applies a mutator to the current state, persists it, and publishes.
	 */
	public update(mutator: (state: T) => T): void {
		this.writeQueue = this.writeQueue
			.then(async () => {
				await this.updateBusy(mutator)
			})
			.catch((error) => {
				console.error(`StorageBackedState: update: failed for "${this.key}"`, error)
			})
	}


	// MARK: updateBusy
	private async updateBusy(mutator: (state: T) => T): Promise<void> {
		if (!this.isReady) {
			this.state  = await this.read()
			this.isReady = true
		}

		const nextState = this.normalize(mutator(this.state))
		this.state       = nextState

		try {
			await Storage.set(this.key, JSON.stringify(nextState))
			console.log(`StorageBackedState: updateBusy: wrote "${this.key}"`, nextState)
			this.publish()
		} catch (error) {
			console.error(`StorageBackedState: updateBusy: failed to write "${this.key}"`, error)
		}
	}


	// MARK: read
	private async read(): Promise<T> {
		try {
			const raw = await Storage.get<string>(this.key)
			if (!raw) {
				return this.createDefault()
			}

			return this.normalize(JSON.parse(raw) as Partial<T>)
		} catch (error) {
			console.error(`StorageBackedState: read: failed to parse "${this.key}"`, error)
			return this.createDefault()
		}
	}


	// MARK: publish
	private publish(): void {
		this.onPublish(this.state)
	}
}
