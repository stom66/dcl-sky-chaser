import { ColliderLayer, engine, Entity, MeshCollider, MeshRenderer, Physics, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

export namespace Trampolines {

	const TRIGGER_RADIUS  = 5.5
	const SHOW_TRIGGER    = false // false for prod

	const IMPULSE_FORCE   = 80
	const IMPULSE_TILT_UP = -20

	const VERTICAL_OFFSET = 1

	class Trampoline {
		entity   : Entity
		direction: Vector3

		constructor(
			pos: Vector3, 
			rot: Quaternion
		) {
			this.entity = engine.addEntity()
			Transform.create(this.entity, { 
				position: Vector3.create(pos.x, pos.y + VERTICAL_OFFSET, pos.z), 
				rotation: rot, 
				scale   : Vector3.create(TRIGGER_RADIUS, TRIGGER_RADIUS, TRIGGER_RADIUS) 
			})

			const forward     = Vector3.rotate(Vector3.Forward(), rot)
			const trueForward = Vector3.rotate(forward, Quaternion.fromEulerDegrees(0, -45, 0))
			const tiltUp      = Vector3.rotate(trueForward, Quaternion.fromEulerDegrees(0, 0, IMPULSE_TILT_UP))

			this.direction    = trueForward

			// Add a spherical collider trigger
			//MeshCollider.setSphere(this.entity)

			TriggerArea.setSphere(this.entity)

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
		}
	
		onTriggerExit() {
			console.log("Trampoline: Player exited")
		}
	}


	const transforms = [
		// trampoline
		{
			position: Vector3.create(264.476, 63.049, 263.725),
			rotation: Quaternion.fromEulerDegrees(0, 57.341, 0),
		},
		// trampoline.001
		{
			position: Vector3.create(263.698, 63.049, 246.848),
			rotation: Quaternion.fromEulerDegrees(0, 296.941, 0),
		},
		// trampoline.002
		{
			position: Vector3.create(244.542, 63.049, 257.475),
			rotation: Quaternion.fromEulerDegrees(0, 238.03, 0),
		},
	]
	

    export function init() {
        for (const transform of transforms) {
            new Trampoline(transform.position, transform.rotation)
        }
    }
}