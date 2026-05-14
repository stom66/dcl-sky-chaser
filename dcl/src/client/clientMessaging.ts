import { MessageType, room } from 'src/shared/room'
import { RequestFooPayload } from 'src/shared/types/shared-types'

import { ClientStore } from 'src/client/clientStore'


export namespace ClientMessaging {

	const clientStore = ClientStore.getInstance()

	// MARK: Request Outfit Change
	export function RequestFoo() {
		console.log('ClientMessaging: RequestFoo')

		const payload: RequestFooPayload = {
			foo: Date.now()
		}
		room.send(MessageType.REQUEST_FOO, payload)
	}
}
