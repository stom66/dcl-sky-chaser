import { MessageType, room } from 'src/shared/room'
import {  } from 'src/shared/types/shared-types'

import { ClientStore } from 'src/client/clientStore'
import { PlayerStats } from 'src/server/metrics/playerStats'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { Vector3 } from '@dcl/sdk/math'


export namespace ClientMessaging {

	const clientStore = ClientStore.getInstance()

	// MARK: Request Outfit Change
	export function RequestNewGame() {
		console.log('ClientMessaging: RequestNewGame')

		room.send(MessageType.REQUEST_NEW_GAME, {})
	}

	export function RequestStatsUpdate(stat: PlayerStats, amount: number = 1) {
		console.log('ClientMessaging: RequestStatsUpdate')
		room.send(MessageType.REQUEST_STATS_UPDATE, { stat, amount })
	}

	function RequestTriggerEffect(
		effect   : ClientEvents,
		position : Vector3,
		direction: Vector3
	) {
		console.log('ClientMessaging: RequestTriggerEffect')
		room.send(MessageType.REQUEST_TRIGGER_EFFECT, { effect, position, direction })
	}

	eventBus.on(ClientEvents.FOUND_ALL_PIGEONS, (data) => { handleFoundAllPigeons() })
	function handleFoundAllPigeons() {
		console.log('ClientMessaging: handleFoundAllPigeons')
		room.send(MessageType.REQUEST_FOUND_ALL_PIGEONS, {})
	}


	eventBus.on(ClientEvents.TRIGGER_AWNING, (data)     => { 
		RequestStatsUpdate(PlayerStats.TRIGGERED_AWNING) 
		RequestTriggerEffect(ClientEvents.TRIGGER_AWNING, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
		room.send(MessageType.REQUEST_TRIGGER_EFFECT, { effect: ClientEvents.TRIGGER_AWNING, position: data?.position ?? Vector3.Zero(), direction: data?.direction ?? Vector3.Zero() })
	})
	eventBus.on(ClientEvents.TRIGGER_TRAMPOLINE, (data) => { 
		RequestStatsUpdate(PlayerStats.TRIGGERED_TRAMPOLINES) 
		RequestTriggerEffect(ClientEvents.TRIGGER_TRAMPOLINE, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
		room.send(MessageType.REQUEST_TRIGGER_EFFECT, { effect: ClientEvents.TRIGGER_TRAMPOLINE, position: data?.position ?? Vector3.Zero(), direction: data?.direction ?? Vector3.Zero() })
	})
	eventBus.on(ClientEvents.TRIGGER_UMBRELLA, (data)   => { 
		RequestStatsUpdate(PlayerStats.TRIGGERED_UMBRELLAS) 
		RequestTriggerEffect(ClientEvents.TRIGGER_UMBRELLA, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
		room.send(MessageType.REQUEST_TRIGGER_EFFECT, { effect: ClientEvents.TRIGGER_UMBRELLA, position: data?.position ?? Vector3.Zero(), direction: data?.direction ?? Vector3.Zero() })
	})
	eventBus.on(ClientEvents.TRIGGER_RING, (data)       => { 
		RequestStatsUpdate(PlayerStats.TRIGGERED_SPEEDRINGS) 
		RequestTriggerEffect(ClientEvents.TRIGGER_RING, data?.position ?? Vector3.Zero(), Vector3.create(0, data?.yRot ?? 0, 0))
		room.send(MessageType.REQUEST_TRIGGER_EFFECT, { effect: ClientEvents.TRIGGER_RING, position: data?.position ?? Vector3.Zero(), direction: data?.direction ?? Vector3.Zero() })
	})
	eventBus.on(ClientEvents.TRIGGER_FUEL, (data)       => { 
		RequestStatsUpdate(PlayerStats.COLLECTED_FUEL, data?.amount ?? 0) 
		RequestTriggerEffect(ClientEvents.TRIGGER_FUEL, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
		room.send(MessageType.REQUEST_TRIGGER_EFFECT, { effect: ClientEvents.TRIGGER_FUEL, position: data?.position ?? Vector3.Zero(), direction: data?.direction ?? Vector3.Zero() })
	})
	eventBus.on(ClientEvents.TRIGGER_BALLOON, (data)    => { 
		RequestStatsUpdate(PlayerStats.COLLECTED_BALLOONS) 
		RequestStatsUpdate(PlayerStats.COLLECTED_POINTS, data?.points ?? 0) 
		RequestTriggerEffect(ClientEvents.TRIGGER_BALLOON, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
		room.send(MessageType.REQUEST_TRIGGER_EFFECT, { effect: ClientEvents.TRIGGER_BALLOON, position: data?.position ?? Vector3.Zero(), direction: data?.direction ?? Vector3.Zero() })
	})


	export function RequestProjectile(position: Vector3, direction: Vector3) {
		console.log('ClientMessaging: RequestProjectile')
		room.send(MessageType.REQUEST_PROJECTILE, { position, direction })
	}
}
