import { EnvVar } from '@dcl/sdk/server'
import { signedFetch } from '~system/SignedFetch'

const POSTHOG_HOST = 'https://eu.i.posthog.com'

export namespace Posthog {

	let apiKey      : string | null = null
	let initPromise : Promise<void> | null = null


	// MARK: captureUrl
	function captureUrl(): string {
		return `${POSTHOG_HOST}/capture/`
	}


	// MARK: Init
	/**
	 * Loads the PostHog API key from server environment variables.
	 * Safe to call multiple times; concurrent callers share one EnvVar lookup.
	 */
	export function init(): void {
		if (initPromise) return

		initPromise = EnvVar.get('POSTHOG_API_KEY').then((key) => {
			apiKey = key?.trim() || null

			if (!apiKey) {
				console.error('Metrics: PostHog init failed: POSTHOG_API_KEY is not configured')
				return
			}

			console.log('Metrics: PostHog initialized')
		}).catch((err) => {
			console.error('Metrics: failed to initialize PostHog', err)
		})
	}


	// MARK: ensureReady
	async function ensureReady(): Promise<boolean> {
		init()
		if (initPromise) await initPromise
		return apiKey !== null
	}


	// MARK: send
	async function send(
		label: string,
		body : Record<string, unknown>
	): Promise<void> {
		if (!(await ensureReady()) || !apiKey) return

		try {
			const response = await signedFetch({
				url : captureUrl(),
				init: {
					method : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body   : JSON.stringify({ ...body, api_key: apiKey }),
				},
			})

			if (!response.ok) {
				console.error(`Metrics: ${label} failed:`, response.status, response.statusText)
			}
		} catch (err) {
			console.error(`Metrics: ${label} failed`, err)
		}
	}


	// MARK: Capture
	/**
	 * Sends a custom analytics event to PostHog.
	 */
	export function capture(distinctId: string, event: string, properties?: Record<string, unknown>) {
		console.log('Metrics: capturing event', event, properties)

		void send(`capture failed for event "${event}"`, {
			event      : event,
			distinct_id: distinctId,
			properties : properties ?? {},
			timestamp  : new Date().toISOString(),
		})
	}


	// MARK: Identify
	/**
	 * Updates person properties in PostHog for the given distinct id.
	 */
	export function identify(distinctId: string, properties: Record<string, unknown>) {
		void send('identify failed', {
			distinct_id: distinctId,
			event      : '$identify',
			properties : properties,
			timestamp  : new Date().toISOString(),
		})
	}
}
