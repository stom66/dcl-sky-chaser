import { EasingFunction, engine, Entity, GltfContainer, Physics, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'
import { isMobile } from "@dcl/sdk/platform"

import { ComponentStore } from "src/shared/components/componentStore"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

import { Pickup } from "src/client/gameComponents/pickups/pickup"
import { sfx, SoundManager } from "src/client/soundManager"
import { showComboToast } from "src/client/ui/themes/skyChaser/pickupToasts"

// MARK: SpeedRingPickup
export class PickupSpeedRing extends Pickup {
	private triggerEntity: Entity | undefined

	private animateDurationActivate : number = 3000
	private animateDurationDeactivate: number = 1000

	private MODEL_SUFFIX = isMobile() ? "_mobile" : "_desktop"

	// MARK: constructor
	constructor(
		public defaultPosition: Vector3,
	) {
		super(defaultPosition)

		GltfContainer.create(this.rootEntity, {
			src: `assets/models/boostRing${this.MODEL_SUFFIX}.gltf`
		})
		utils.timers.setTimeout(() => {
			Tween.setScale(this.rootEntity, Vector3.Zero(), Vector3.One(), Math.random() * 1600 + 200, EasingFunction.EF_EASEOUTBACK)
		}, Math.random() * 800 + 200)
	}


	// MARK: onTriggerPickup
	protected onTriggerPickup(
		triggerEntity: Entity,
	) : void {
		if (triggerEntity !== engine.PlayerEntity) return

		this.onTriggerByPlayer()
		this.Deactivate()
	}


	// MARK: onTriggerByPlayer
	onTriggerByPlayer() : void {
		console.log("SpeedRingPickup: onTriggerByPlayer: Player entered")

		// Boost the player forwards and up
		const playerTransform = Transform.getOrNull(engine.PlayerEntity)
		if (!playerTransform) return

		const tiltUp        = Vector3.rotate(Vector3.Forward(), Quaternion.fromEulerDegrees(-45, 0, 0))
		const playerForward = Vector3.rotate(tiltUp, playerTransform.rotation)

		Physics.applyImpulseToPlayer(playerForward, 64)
		SoundManager.playSound(sfx.swish)

		const yRot        = Quaternion.toEulerAngles(playerTransform.rotation).y
		const comboBefore = ComponentStore.getComboValue()

		eventBus.emit(ClientEvents.PLAYER_COLLIDED_RING, {
			position: playerTransform.position,
			yRot    : yRot
		})

		const comboAfter = ComponentStore.getComboValue()
		if (comboAfter > comboBefore) {
			showComboToast(1)
		}
	}


	// MARK: createTriggers
	createTriggers() {
		if (this.triggerEntity) return

		this.triggerEntity = engine.addEntity()
		Transform.create(this.triggerEntity, {
			parent: this.rootEntity,
			scale : Vector3.create(5, 5, 5)
		})

		TriggerArea.setSphere(this.triggerEntity)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			const triggerEntity = e.trigger?.entity as Entity | undefined
			if (!triggerEntity) return

			if (triggerEntity === engine.PlayerEntity) {
				this.TryTriggerPickup(triggerEntity)
				return
			}

			this.Deactivate()
		})
	}


	// MARK: destroyTriggers
	destroyTriggers() {
		if (this.triggerEntity) {
			engine.removeEntity(this.triggerEntity)
			this.triggerEntity = undefined
		}
	}


	// MARK: onActivate
	protected onActivate(
		position: Vector3,
	) : void {
		const t = Transform.getMutableOrNull(this.rootEntity)
		if (!t) return

		const startPosition = Vector3.create(position.x, 0, position.z)
		t.position = startPosition
		t.scale    = Vector3.One()
		t.rotation = Quaternion.fromEulerDegrees(0, Math.random() * 360, 0)
		Tween.setMove(this.rootEntity, startPosition, position, Math.random() * this.animateDurationActivate + this.animateDurationActivate, EasingFunction.EF_EASEOUTBACK)

		this.createTriggers()
	}


	// MARK: onDeactivate
	protected onDeactivate(silent: boolean) : void {
		Tween.setScale(this.rootEntity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_EASEINCIRC)

		this.destroyTriggers()
	}


	// MARK: onStep
	protected onStep(
		dt: number,
	) : void {
		// Stub
	}
}
