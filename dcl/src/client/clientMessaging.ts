import { MessageType, room } from 'src/shared/room'
import {  } from 'src/shared/types/shared-types'

import { ClientStore } from 'src/client/clientStore'
import { PlayerStatsEnum } from 'src/shared/metrics/playerStats'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { Vector3 } from '@dcl/sdk/math'


export namespace ClientMessaging {

	// MARK: Vars
	const clientStore = ClientStore.getInstance()

	// AMRK: Functions
	// MARK: Request Outfit Change
	export function RequestNewGame() {
		console.log('ClientMessaging: RequestNewGame')

		room.send(MessageType.REQUEST_NEW_GAME, {})
	}

	export function RequestStatsUpdate(stat: PlayerStatsEnum, amount: number = 1) {
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

	export function RequestProjectile(position: Vector3, direction: Vector3) {
		console.log('ClientMessaging: RequestProjectile')
		room.send(MessageType.REQUEST_PROJECTILE, { position, direction })
	}




	eventBus.on(ClientEvents.PLAYER_FOUND_ALL_PIGEONS, (data) => { handleFoundAllPigeons() })
	function handleFoundAllPigeons() {
		console.log('ClientMessaging: handleFoundAllPigeons')
		room.send(MessageType.REQUEST_FOUND_ALL_PIGEONS, {})
	}


	eventBus.on(ClientEvents.PLAYER_COLLIDED_AWNING, (data)     => { 
		RequestStatsUpdate(PlayerStatsEnum.TRIGGERED_AWNING) 
		RequestTriggerEffect(ClientEvents.PLAYER_COLLIDED_AWNING, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
	})
	eventBus.on(ClientEvents.PLAYER_COLLIDED_TRAMPOLINE, (data) => { 
		RequestStatsUpdate(PlayerStatsEnum.TRIGGERED_TRAMPOLINES) 
		RequestTriggerEffect(ClientEvents.PLAYER_COLLIDED_TRAMPOLINE, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
	})
	eventBus.on(ClientEvents.PLAYER_COLLIDED_UMBRELLA, (data)   => { 
		RequestStatsUpdate(PlayerStatsEnum.TRIGGERED_UMBRELLAS) 
		RequestTriggerEffect(ClientEvents.PLAYER_COLLIDED_UMBRELLA, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
	})
	eventBus.on(ClientEvents.PLAYER_COLLIDED_RING, (data)       => { 
		RequestStatsUpdate(PlayerStatsEnum.TRIGGERED_SPEEDRINGS) 
		RequestTriggerEffect(ClientEvents.PLAYER_COLLIDED_RING, data?.position ?? Vector3.Zero(), Vector3.create(0, data?.yRot ?? 0, 0))
	})
	eventBus.on(ClientEvents.PLAYER_COLLIDED_FUEL, (data)       => { 
		RequestStatsUpdate(PlayerStatsEnum.COLLECTED_FUEL, data?.amount ?? 0) 
		RequestTriggerEffect(ClientEvents.PLAYER_COLLIDED_FUEL, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
	})


	// MARK: PROJECTILE_HIT
	eventBus.on(ClientEvents.PROJECTILE_HIT_BALLOON, (data)    => { 
		// Was it OUR projectile?
		if (data.projectileOwner !== "") return

		RequestStatsUpdate(PlayerStatsEnum.COLLECTED_BALLOONS) 
		RequestStatsUpdate(PlayerStatsEnum.COLLECTED_POINTS, data?.points ?? 0) 
		RequestTriggerEffect(ClientEvents.PROJECTILE_HIT_BALLOON, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
		//room.send(MessageType.REQUEST_TRIGGER_EFFECT, { effect: ClientEvents.PROJECTILE_HIT_BALLOON, position: data?.position ?? Vector3.Zero(), direction: data?.direction ?? Vector3.Zero() })
	})


	// MARK: PLAYER_COLLIDED
	eventBus.on(ClientEvents.PLAYER_COLLIDED_BALLOON, (data)    => { 
		RequestStatsUpdate(PlayerStatsEnum.COLLECTED_BALLOONS) 
		RequestStatsUpdate(PlayerStatsEnum.COLLECTED_POINTS, data?.points ?? 0) 
		RequestTriggerEffect(ClientEvents.PLAYER_COLLIDED_BALLOON, data?.position ?? Vector3.Zero(), data?.direction ?? Vector3.Zero())
		//room.send(MessageType.REQUEST_TRIGGER_EFFECT, { effect: ClientEvents.PLAYER_COLLIDED_BALLOON, position: data?.position ?? Vector3.Zero(), direction: data?.direction ?? Vector3.Zero() })
	})



}
