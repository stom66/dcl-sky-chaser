import { MessageType, room } from 'src/shared/room'
import {  } from 'src/shared/types/shared-types'

import { ClientStore } from 'src/client/clientStore'
import { PlayerStats } from 'src/server/metrics/playerStats'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


export namespace ClientMessaging {

	const clientStore = ClientStore.getInstance()

	// MARK: Request Outfit Change
	export function RequestNewGame() {
		console.log('ClientMessaging: RequestNewGame')

		room.send(MessageType.REQUEST_NEW_GAME, {})
	}

/* 	export function RequestScoreUpdate(amount: number = 1) {
		console.log('ClientMessaging: RequestScoreUpdate')
		room.send(MessageType.REQUEST_SCORE_UPDATE, amount)
	} */

	export function RequestStatsUpdate(stat: PlayerStats, amount: number = 1) {
		console.log('ClientMessaging: RequestStatsUpdate')
		room.send(MessageType.REQUEST_STATS_UPDATE, { stat, amount })
	}

	eventBus.on(ClientEvents.FOUND_ALL_PIGEONS, (data) => { handleFoundAllPigeons() })
	function handleFoundAllPigeons() {
		console.log('ClientMessaging: handleFoundAllPigeons')
		room.send(MessageType.REQUEST_FOUND_ALL_PIGEONS, {})
	}
}
