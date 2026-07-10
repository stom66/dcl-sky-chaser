import { engine, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

import { BounceTrigger } from "src/client/gameComponents/bounceTriggers/bounceTrigger"

import { ClientMessaging } from "src/client/clientMessaging"
import { sfx, SoundManager } from "src/client/soundManager"
import { ParticleSpawner } from "src/client/particleSpawner"
import { PlayerStats } from "src/server/metrics/playerStats"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"


export class BounceTriggerTrampoline extends BounceTrigger {

	constructor(
		position: Vector3 = Vector3.create(256, 65, 256),
		yRotation: number = 0,
		strength: number = 120
	) {
		const forwardUp = Vector3.rotate(Vector3.Forward(), Quaternion.fromEulerDegrees(-55, 0, 0))
		const direction = Vector3.rotate(forwardUp, Quaternion.fromEulerDegrees(0, yRotation, 0))

		super({
			impulseDirection: direction,
			impulseStrength : strength,
			triggerPosition : position,
			triggerScale    : Vector3.create(6.25, 6.25, 6.25),
			meshName        : "canvas"
		})
	}

	protected OnBounce(
		position: Vector3, 
		normal  : Vector3
	) {
		SoundManager.playSound(sfx.boing)
		
		eventBus.emit(ClientEvents.TRIGGER_TRAMPOLINE, { position, normal })
	}
}
