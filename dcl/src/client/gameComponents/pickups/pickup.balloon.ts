import { ColliderLayer, EasingFunction, engine, Entity, GltfContainer, Material, MeshCollider, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'
import { isMobile } from "@dcl/sdk/platform"

import { BalloonPickup as BalloonPickupComponent } from "src/shared/components/balloonPickup"
import { ComponentStore } from "src/shared/components/componentStore"
import { ProjectileComponent } from "src/shared/components/projectile"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

import { Pickup } from "src/client/gameComponents/pickups/pickup"
import { sfx, SoundManager } from "src/client/soundManager"
import { showScoreToast } from "src/client/ui/themes/skyChaser/pickupToasts"

const TRIGGER_DEBUG_COLOR = Color4.fromHexString('#F0BB18ff')

const MIN_RISE_SPEED = 0.25
const MAX_RISE_SPEED = 4.0

// MARK: PickupBalloon
export class PickupBalloon extends Pickup {
	private triggerEntity  : Entity | undefined
	private triggerEntity2 : Entity | undefined

	private defaultValue   : number  = 1
	private triggerScale   : number  = 3.5
	private SHOW_TRIGGER   : boolean = false

	private MODEL_SUFFIX = isMobile() ? "_mobile" : "_desktop"

	// MARK: constructor
	constructor(
		public defaultPosition : Vector3,
		public value           : number = 1,
		public maxHeight       : number = 200,
		public riseSpeed       : number = Math.random() * (MAX_RISE_SPEED - MIN_RISE_SPEED) + MIN_RISE_SPEED,
		public spinSpeed       : number = Math.random() * 180 - 90,
	) {
		super(defaultPosition)

		BalloonPickupComponent.create(this.rootEntity, { 
			value    : this.value,
			riseSpeed: this.riseSpeed,
			spinSpeed: this.spinSpeed
		})

		GltfContainer.create(this.rootEntity, {
			//src: `assets/models/balloon_0${this.randomIndex}.gltf`
			src: `assets/models/balloon${this.MODEL_SUFFIX}.gltf`
		})
		MeshCollider.setSphere(this.rootEntity, ColliderLayer.CL_CUSTOM2)

	}


	// MARK: getValue
	getValue() : number {
		const component = BalloonPickupComponent.getOrNull(this.rootEntity)
		return component?.value ?? this.defaultValue
	}


	// MARK: onTriggerPickup
	protected onTriggerPickup(
		triggerEntity: Entity,
	) : void {
		if (triggerEntity === engine.PlayerEntity) {
			this.onHitByPlayer()
			this.Deactivate()
			return
		}

		if (ProjectileComponent.has(triggerEntity)) {
			this.onHitByProjectile(triggerEntity)
			this.Deactivate()
			return
		}
	}


	// MARK: onHitByPlayer
	onHitByPlayer() : void {
		console.log("PickupBalloon: onHitByPlayer: Player entered")
		const combo  = ComponentStore.getComboValue()
		const points = this.getValue() * combo

		eventBus.emit(ClientEvents.PLAYER_COLLIDED_BALLOON, {
			position: this.getPosition(),
			points  : points
		})
		showScoreToast(points)
	}


	// MARK: onHitByProjectile
	onHitByProjectile(
		entity: Entity,
	) : void {
		const owner  = ProjectileComponent.getOrNull(entity)?.owner ?? ""
		const combo  = ComponentStore.getComboValue()
		const points = this.getValue() * combo

		eventBus.emit(ClientEvents.PROJECTILE_HIT_BALLOON, {
			points          : points,
			position        : this.getPosition(),
			projectileEntity: entity,
			projectileOwner : owner
		})

		if (owner === "") {
			showScoreToast(points)
		}

		// Allow players to get points from SHOOTING balloons as well
/* 		if (owner === "") {
			this.onHitByPlayer()
		} else {
			eventBus.emit(ClientEvents.NOTIFY_TRIGGER, {
				effect  : ClientEvents.PLAYER_COLLIDED_BALLOON,
				position: this.defaultPosition
			})
		} */
	}


	// MARK: createTriggers
	createTriggers() {
		if (this.triggerEntity || this.triggerEntity2) return

		// First Trigger - top - larger, covers the ballooon
		this.triggerEntity = engine.addEntity()
		Transform.create(this.triggerEntity, { 
			parent: this.rootEntity, 
			scale: Vector3.create(this.triggerScale, this.triggerScale, this.triggerScale) 
		})

		TriggerArea.setSphere(this.triggerEntity, ColliderLayer.CL_PLAYER | ColliderLayer.CL_CUSTOM1)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			const triggerEntity = e.trigger?.entity as Entity | undefined
			if (!triggerEntity) return

			this.TryTriggerPickup(triggerEntity)
		})

		
		// Second Trigger - bottom - covers the package
		this.triggerEntity2 = engine.addEntity()
		Transform.create(this.triggerEntity2, { 
			parent: this.rootEntity, 
			position: Vector3.create(0, -3, 0),
			scale: Vector3.create(this.triggerScale * 0.65, this.triggerScale * 0.65, this.triggerScale * 0.65) 
		})

		TriggerArea.setSphere(this.triggerEntity2, ColliderLayer.CL_PLAYER | ColliderLayer.CL_CUSTOM1)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity2, (e) => {
			const triggerEntity = e.trigger?.entity as Entity | undefined
			if (!triggerEntity) return

			this.TryTriggerPickup(triggerEntity)
		})

		// Debug visibility
		if (this.SHOW_TRIGGER) {
			MeshRenderer.setSphere(this.triggerEntity)
			Material.setPbrMaterial(this.triggerEntity, { 
				albedoColor      : TRIGGER_DEBUG_COLOR,
				emissiveColor    : TRIGGER_DEBUG_COLOR,
				emissiveIntensity: 0.2
			})
			MeshRenderer.setSphere(this.triggerEntity2)
			Material.setPbrMaterial(this.triggerEntity2, { 
				albedoColor      : TRIGGER_DEBUG_COLOR,
				emissiveColor    : TRIGGER_DEBUG_COLOR,
				emissiveIntensity: 0.2
			})

		}
	}


	// MARK: destroyTriggers	
	destroyTriggers() {
		if (this.triggerEntity) {
			engine.removeEntity(this.triggerEntity)
			this.triggerEntity = undefined
		}
		if (this.triggerEntity2) {
			engine.removeEntity(this.triggerEntity2)
			this.triggerEntity2 = undefined
		}
	}


	// MARK: onActivate
	protected onActivate(
		position: Vector3,
	) : void {
		// Move it
		const t = Transform.getMutableOrNull(this.rootEntity)
		if (!t) return

		t.position = position
		t.scale    = Vector3.Zero()
		Tween.setScale(this.rootEntity, Vector3.Zero(), Vector3.One(), 200, EasingFunction.EF_EASEOUTBACK)

		this.createTriggers()
	}


	// MARK: onDeactivate
	protected onDeactivate(silent: boolean) : void {
		Tween.setScale(this.rootEntity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_LINEAR)

		if (!silent) {
			SoundManager.playSound(sfx.balloonPickup, this.rootEntity)
		}

		this.destroyTriggers()
	}


	// MARK: onStep
	protected onStep(
		dt: number,
	) : void {
		const t = Transform.getMutableOrNull(this.rootEntity)
		if (!t) return

		const currentRotation = Quaternion.toEulerAngles(t.rotation)
		t.rotation = Quaternion.fromEulerDegrees(currentRotation.x, currentRotation.y + dt * this.spinSpeed, currentRotation.z)
		t.position.y += dt * this.riseSpeed

		// Despawn Balloons
		if (t.position.y > (this.maxHeight)) {
			this.Deactivate()
		}
	}
}
