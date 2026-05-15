import { MessageType, room } from 'src/shared/room'
import {  } from 'src/shared/types/shared-types'

import { ClientStore } from 'src/client/clientStore'


export namespace ClientMessaging {

	const clientStore = ClientStore.getInstance()

	// MARK: Request Outfit Change
	export function RequestNewGame() {
		console.log('ClientMessaging: RequestNewGame')

		room.send(MessageType.REQUEST_NEW_GAME, {})
	}

	export function RequestScoreUpdate() {
		console.log('ClientMessaging: RequestScoreUpdate')
		room.send(MessageType.REQUEST_SCORE_UPDATE, {})
	}

}
