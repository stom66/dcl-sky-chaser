import { engine, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

import { BounceTrigger } from "src/client/gameComponents/bounceTrigger"

import { ClientMessaging } from "src/client/clientMessaging"
import { sfx, SoundManager } from "src/client/soundManager"
import { ParticleSpawner } from "src/client/particleSpawner"
import { PlayerStats } from "src/server/metrics/playerStats"


export class BounceTriggerAwning extends BounceTrigger {

	constructor(
		position: Vector3    = Vector3.create(256, 65, 256),
		rotation: Quaternion = Quaternion.fromEulerDegrees(-45, 0, 0),
		scale   : Vector3    = Vector3.create(4, 4, 4),
		strength: number     = 120
	) {
		super({
			triggerPosition : position,
			triggerRotation : rotation,
			triggerScale    : scale,
			triggerShape    : "box",
			meshName        : "awning",
			impulseDirection: Vector3.rotate(Vector3.Forward(), Quaternion.fromEulerDegrees(-45, 0, 0)),
			impulseStrength : strength,
		})
	}

	protected OnBounce() {
		ClientMessaging.RequestStatsUpdate(PlayerStats.TRIGGERED_AWNING)
		SoundManager.playSound(sfx.boing)
		ParticleSpawner.TriggerDustSpurt(Transform.getOrNull(engine.PlayerEntity)?.position ?? Vector3.create(256, 63.2, 256))
	}
}
