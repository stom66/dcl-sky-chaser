import { engine, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

import { BounceTrigger } from "src/client/gameComponents/bounceTrigger"

import { ClientMessaging } from "src/client/clientMessaging"
import { sfx, SoundManager } from "src/client/soundManager"
import { ParticleSpawner } from "src/client/particleSpawner"
import { PlayerStats } from "src/server/metrics/playerStats"


export class BounceTriggerUmbrella extends BounceTrigger {

	constructor(
		position: Vector3 = Vector3.create(256, 65, 256),
		strength: number = 100
	) {
		super({
			triggerPosition : position,
			triggerScale    : Vector3.create(8, 8, 8),
			triggerMaxDistance: 0.2, // needs to be a little further for the tilt of the umbrella
			meshName        : "parasol",
			//impulseDirection: Vector3.Up(),
			impulseStrength : strength,
		})
	}

	protected OnBounce() {
		ClientMessaging.RequestStatsUpdate(PlayerStats.TRIGGERED_UMBRELLAS)
		SoundManager.playSound(sfx.boing)
		ParticleSpawner.TriggerDustSpurt(Transform.getOrNull(engine.PlayerEntity)?.position ?? Vector3.create(256, 63.2, 256))
	}
}
