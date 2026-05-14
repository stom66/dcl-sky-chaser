import { ComponentStore } from 'src/shared/components/componentStore'
import { MessageType, room } from 'src/shared/room'

import { ServerMessaging } from 'src/server/serverMessaging'
import { ServerStore } from 'src/server/serverStore'
import { NotifyFooBarPayload, RequestFooPayload } from 'src/shared/types/shared-types'


export namespace serverHandler {

	// MARK: Vars
	const store = ServerStore.getInstance()


	// MARK: Utility function
	function getUserId(context: any): string {
		return typeof context?.from === 'string' ? context.from : 'unknown'
	}


	// MARK: Init
	export function init() {
		room.onMessage(MessageType.REQUEST_FOO, (data, context) => handleRequestFoo(data, context))
	}

	// MARK: Request Foo
	export async function handleRequestFoo(data: RequestFooPayload, context: any) {
		const userId = getUserId(context)
		console.log('handleRequestFoo: userId', userId, 'bar', data.foo)

		ComponentStore.setFooBar(userId, data.foo)
		//ComponentStore.scoreBoard.addScore(userId, 1)
		room.send(MessageType.NOTIFY_FOO_RESULT, ComponentStore.getFooBar())
	}
}
