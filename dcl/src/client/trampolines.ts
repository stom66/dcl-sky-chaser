import { ColliderLayer, engine, Entity, MeshCollider, MeshRenderer, Physics, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { sfx, SoundManager } from "./soundManager"
import { ParticleSpawner } from "./particleSpawner"
import { ClientMessaging } from "./clientMessaging"
import { PlayerStats } from "src/server/metrics/playerStats"

export namespace Trampolines {

	const TRIGGER_RADIUS  = 5.5
	const SHOW_TRIGGER    = false // false for prod

	const IMPULSE_FORCE   = 120
	const IMPULSE_TILT_UP = -55

	const VERTICAL_OFFSET = 1

	
	class Trampoline {
		private isAwning: boolean = false
		entity   : Entity
		direction: Vector3

		constructor(
			pos  : Vector3, 
			rot  : Quaternion,
			scale: Vector3 = Vector3.create(TRIGGER_RADIUS, TRIGGER_RADIUS, TRIGGER_RADIUS),
			isAwning: boolean = false
		) {
			this.isAwning = isAwning

			this.entity = engine.addEntity()
			Transform.create(this.entity, { 
				position: Vector3.create(pos.x, pos.y + VERTICAL_OFFSET, pos.z), 
				rotation: rot, 
				scale   : scale
			})

			const tiltUp      = Vector3.rotate(Vector3.Backward(), Quaternion.fromEulerDegrees(-IMPULSE_TILT_UP, 0, 0))
			const forward     = Vector3.rotate(tiltUp, rot)

			this.direction    = forward

			// Add a spherical collider trigger
			//MeshCollider.setSphere(this.entity)

			// if we have a scale, then we should use a cube
			if (isAwning) {
				TriggerArea.setBox(this.entity)
				//MeshRenderer.setBox(this.entity)
			} else {
				TriggerArea.setSphere(this.entity)
			}

			// Add a visual sphere for debugging
			if (SHOW_TRIGGER) MeshRenderer.setSphere(this.entity)

			triggerAreaEventsSystem.onTriggerEnter(this.entity, (e) => {
				if (e.trigger?.entity === engine.PlayerEntity) this.onTriggerEnter()
			})
			triggerAreaEventsSystem.onTriggerExit(this.entity, (e) => {
				if (e.trigger?.entity === engine.PlayerEntity) this.onTriggerExit()
			})
		}

		onTriggerEnter() {
			console.log("Trampoline: Player entered")
			// Apply an impulse to the player
			Physics.applyImpulseToPlayer(this.direction, IMPULSE_FORCE)
			SoundManager.playSound(sfx.boing)
			ParticleSpawner.TriggerDustSpurt(Transform.getOrNull(engine.PlayerEntity)?.position ?? Vector3.create(256, 63.2, 256))

			if (this.isAwning) {
				ClientMessaging.RequestStatsUpdate(PlayerStats.TRIGGERED_AWNING)
			} else {
				ClientMessaging.RequestStatsUpdate(PlayerStats.TRIGGERED_TRAMPOLINES)
			}
		}
	
		onTriggerExit() {
			console.log("Trampoline: Player exited")
		}
	}


	const transforms = [
		// trampoline.001
		{
			position: Vector3.create(262.903, 63.049, 246.848),
			rotation: Quaternion.fromEulerDegrees(0, 45, 0),
		},
		// trampoline.002
		{
			position: Vector3.create(245.332, 63.049, 256.61),
			rotation: Quaternion.fromEulerDegrees(0, 90, 0),
		}
	]
	

    export function init() {
        for (const transform of transforms) {
            new Trampoline(transform.position, transform.rotation, )
        }

		// Also make the awning a trampoline
		const awningTranform = {
			position: Vector3.create(258.163, 56.5, 278.01),
			rotation: Quaternion.fromEulerDegrees(-24, 180, 0),
			scale   : Vector3.create(8.6, 0.75, 6.9),
		}
		new Trampoline(awningTranform.position, awningTranform.rotation, awningTranform.scale, true)
    }
}