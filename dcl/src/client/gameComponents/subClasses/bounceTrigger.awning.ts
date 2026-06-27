import { engine, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

import { BounceTrigger } from "src/client/gameComponents/bounceTrigger"

import { ClientMessaging } from "src/client/clientMessaging"
import { sfx, SoundManager } from "src/client/soundManager"
import { ParticleSpawner } from "src/client/particleSpawner"
import { PlayerStats } from "src/server/metrics/playerStats"
import { ClientEvents } from "src/client/clientEvents"
import { eventBus } from "src/shared/utils/eventBus"


export class BounceTriggerAwning extends BounceTrigger {

	constructor(
		position       : Vector3    = Vector3.create(256, 65, 256),
		triggerRotation: Quaternion = Quaternion.fromEulerDegrees(-45, 0, 0),
		scale          : Vector3    = Vector3.create(4, 4, 4),
		strength       : number     = 120,
		yRotation      : number     = 0,
	) {
		const direction = Vector3.rotate(Vector3.Forward(), Quaternion.fromEulerDegrees(-45, yRotation, 0))
		super({
			triggerPosition : position,
			triggerRotation : triggerRotation,
			triggerScale    : scale,
			triggerShape    : "box",
			meshName        : "awning",
			impulseDirection: direction,
			impulseStrength : strength,
		})
	}

	protected OnBounce(
		position: Vector3, 
		normal  : Vector3
	) {
		SoundManager.playSound(sfx.boing)
		
		eventBus.emit(ClientEvents.TRIGGER_AWNING, { position, normal })
	}
}
