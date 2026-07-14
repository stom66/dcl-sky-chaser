import { EasingFunction, engine, Entity, GltfContainer, Physics, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

import { Pickup } from "src/client/gameComponents/pickups/pickup"
import { sfx, SoundManager } from "src/client/soundManager"

// MARK: SpeedRingPickup
export class PickupSpeedRing extends Pickup {
	private triggerEntity: Entity

	private animateDurationActivate : number = 3000
	private animateDurationDeactivate: number = 1000

	// MARK: constructor
	constructor(
		public defaultPosition: Vector3,
	) {
		super(defaultPosition)

		GltfContainer.create(this.rootEntity, {
			src: "assets/models/boostRing.gltf"
		})
		utils.timers.setTimeout(() => {
			Tween.setScale(this.rootEntity, Vector3.Zero(), Vector3.One(), Math.random() * 1600 + 200, EasingFunction.EF_EASEOUTBACK)
		}, Math.random() * 800 + 200)

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

		const yRot = Quaternion.toEulerAngles(playerTransform.rotation).y
		eventBus.emit(ClientEvents.PLAYER_COLLIDED_RING, {
			position: playerTransform.position,
			yRot    : yRot
		})
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
	}


	// MARK: onDeactivate
	protected onDeactivate(silent: boolean) : void {
		Tween.setScale(this.rootEntity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_EASEINCIRC)
	}


	// MARK: onStep
	protected onStep(
		dt: number,
	) : void {
		// Stub
	}
}
