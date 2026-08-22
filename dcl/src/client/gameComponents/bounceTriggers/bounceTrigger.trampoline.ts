import { Animator, Entity, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

import { BounceTrigger } from "src/client/gameComponents/bounceTriggers/bounceTrigger"
import { sfx, SoundManager } from "src/client/soundManager"


export class BounceTriggerTrampoline extends BounceTrigger {

	constructor(
		private readonly entity: Entity,
		strength: number = 120
	) {
		const t = Transform.getOrNull(entity)
		if (!t) {
			throw new Error("BounceTriggerTrampoline: constructor: trampoline entity has no transform")
		}

		const position  = Vector3.add(t.position, Vector3.create(0, 1, 0))
		const yRotation = Quaternion.toEulerAngles(t.rotation).y

		const forwardUp = Vector3.rotate(Vector3.Forward(), Quaternion.fromEulerDegrees(-55, 0, 0))
		const direction = Vector3.rotate(forwardUp, Quaternion.fromEulerDegrees(0, yRotation, 0))

		super({
			impulseDirection: direction,
			impulseStrength : strength,
			triggerPosition : position,
			triggerScale    : Vector3.create(8, 8, 8),
			meshName        : "outer_collider"
		})

		eventBus.on(ClientEvents.NOTIFY_TRIGGER, (data) => {
			if (data.effect !== ClientEvents.PLAYER_COLLIDED_TRAMPOLINE) return
			if (data.entityId !== this.entity.toString()) return

			Animator.playSingleAnimation(this.entity, "wobble")
		})
	}

	// MARK: OnBounce
	/**
	 * Play trampoline bounce SFX / animation and emit the collision event.
	 */
	protected OnBounce(
		position: Vector3,
		normal  : Vector3
	) {
		SoundManager.playSound(sfx.boing)

		const entityId = this.entity.toString()
		eventBus.emit(ClientEvents.PLAYER_COLLIDED_TRAMPOLINE, { position, normal, entityId })

		Animator.playSingleAnimation(this.entity, "wobble")
	}
}
