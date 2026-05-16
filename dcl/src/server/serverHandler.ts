import { ComponentStore } from 'src/shared/components/componentStore'
import { MessageType, room } from 'src/shared/room'

import { ServerMessaging } from 'src/server/serverMessaging'
import { ServerStore } from 'src/server/serverStore'


export namespace serverHandler {

	// MARK: Vars
	const store = ServerStore.getInstance()


	// MARK: Utility function
	function getUserId(context: any): string {
		return typeof context?.from === 'string' ? context.from : 'unknown'
	}


	// MARK: Init
	export function init() {
		room.onMessage(MessageType.REQUEST_NEW_GAME, (data, context) => handleRequestNewGame(data, context))
		room.onMessage(MessageType.REQUEST_SCORE_UPDATE, (data, context) => handleRequestScoreUpdate(data, context))
	}

	// MARK: Request NewGame
	export async function handleRequestNewGame(data: any, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestNewGame: userId', userId)

		ComponentStore.resetAllComponents()
	}

	// MARK: Request Score Update
	export async function handleRequestScoreUpdate(data: any, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestScoreUpdate: userId', userId)

		ComponentStore.incrementPlayerScore(userId, data)
	}
}
