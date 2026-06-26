import { ColliderLayer, EasingFunction, engine, Entity, GltfContainer, GltfNodeModifiers, Material, MeshCollider, MeshRenderer, PBMaterial, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { ComponentStore } from "src/shared/components/componentStore"
import { BalloonPickup as BalloonPickupComponent } from "src/shared/components/balloonPickup"
import { ProjectileComponent } from "src/shared/components/projectile"
export { BalloonPickupComponent as BalloonPickupComponent }

import { darken, lighten, theme } from "../ui"
import { sfx, SoundManager } from "../soundManager"
import { ClientMessaging } from "../clientMessaging"
import { PlayerStats } from "src/server/metrics/playerStats"
import { ParticleSpawner } from "../particleSpawner"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export class BalloonPickup {
	public entity: Entity
	private triggerEntity2: Entity
	private triggerEntity: Entity
	private startPosition: Vector3

	private defaultValue: number = 1
	private triggerScale: number = 3.5

	private SHOW_TRIGGER: boolean = false

	private pickupTriggered: boolean = false
	private isDestroyed    : boolean = false

	//private randomIndex: number = Math.floor(Math.random() * 4) + 1

    constructor(
		public position : Vector3, 
		//public packageColor: Color4 = theme.colors.warning,
		//public balloonColor: Color4 = theme.colors.warning,
		public value    : number = this.defaultValue,
		public maxHeight: number = 200,
		public riseSpeed: number = Math.random() * 4 + 0.1,
		public spinSpeed: number = Math.random() * 20 - 10,
	) {

		this.entity = engine.addEntity()
		BalloonPickupComponent.create(this.entity, { 
			value    : this.value,
			riseSpeed: this.riseSpeed,
			spinSpeed: this.spinSpeed
		})

		this.startPosition = this.position
		Transform.create(this.entity, { 
			position: this.position,
			rotation: Quaternion.fromEulerDegrees(0, Math.random() * 360, 0)
		})

		GltfContainer.create(this.entity, {
			//src: `assets/models/balloon_0${this.randomIndex}.gltf`
			src: `assets/models/balloon_new.gltf`
		})
		MeshCollider.setSphere(this.entity, ColliderLayer.CL_CUSTOM2)



		// First Trigger - top - larger, covers the ballooon
		this.triggerEntity = engine.addEntity()
		Transform.create(this.triggerEntity, { 
			parent: this.entity, 
			scale: Vector3.create(this.triggerScale, this.triggerScale, this.triggerScale) 
		})

		TriggerArea.setSphere(this.triggerEntity, ColliderLayer.CL_PLAYER | ColliderLayer.CL_CUSTOM1)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			if (!e.trigger?.entity) return
			this.onTriggerEnter(e.trigger?.entity as Entity)
		})

		
		// Second Trigger - bottom - covers the package
		this.triggerEntity2 = engine.addEntity()
		Transform.create(this.triggerEntity2, { 
			parent: this.entity, 
			position: Vector3.create(0, -3, 0),
			scale: Vector3.create(this.triggerScale * 0.65, this.triggerScale * 0.65, this.triggerScale * 0.65) 
		})

		TriggerArea.setSphere(this.triggerEntity2, ColliderLayer.CL_PLAYER | ColliderLayer.CL_CUSTOM1)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity2, (e) => {
			if (!e.trigger?.entity) return
			this.onTriggerEnter(e.trigger?.entity as Entity)
	})

		


		// Debug visibility
		if (this.SHOW_TRIGGER) {
			MeshRenderer.setSphere(this.triggerEntity)
			Material.setPbrMaterial(this.triggerEntity, { 
				albedoColor      : theme.colors.warning,
				emissiveColor    : theme.colors.warning,
				emissiveIntensity: 0.2
			})
			MeshRenderer.setSphere(this.triggerEntity2)
			Material.setPbrMaterial(this.triggerEntity2, { 
				albedoColor      : theme.colors.warning,
				emissiveColor    : theme.colors.warning,
				emissiveIntensity: 0.2
			})

		}
    }

	onTriggerEnter(triggerEntity: Entity) {
		if (triggerEntity === engine.PlayerEntity) {
			this.onHitByPlayer()
			this.Destroy()
			return
		}

		if (triggerEntity !== undefined && ProjectileComponent.has(triggerEntity)) {
			this.onHitByProjectile(triggerEntity)
			this.Destroy()
			return
		}
	}

	getValue() {
		const c = BalloonPickupComponent.get(this.entity)
		return c?.value ?? this.defaultValue
	}

	// MARK: onHitByPlayer
	onHitByPlayer() {
		if (this.pickupTriggered) return
		this.pickupTriggered = true

		console.log("BalloonPickup: Player entered")
		const combo = ComponentStore.getComboValue()

		const t = Transform.getOrNull(this.entity)
		if (!t) return

		eventBus.emit(ClientEvents.TRIGGER_BALLOON, {position: t.position, points: this.getValue() * combo})
	}


	// MARK: onHitByProjectile
	onHitByProjectile(
		entity: Entity
	) : void {
		if (this.isDestroyed) return

		const owner = ProjectileComponent.getOrNull(entity)?.owner ?? ""
		const t = Transform.getOrNull(this.entity)
		if (!t) return

		eventBus.emit(ClientEvents.PROJECTILE_HIT_BALLOON, { 
			position        : t.position, 
			projectileEntity: entity, 
			projectileOwner : owner 
		})

		// Allow players to get points from SHOOTING balloons as well
		if (owner === "") {
			this.onHitByPlayer() // If it was our own projectile, get the point for it
		} else {
			eventBus.emit(ClientEvents.NOTIFY_TRIGGER, { effect: ClientEvents.TRIGGER_BALLOON, position: this.position })
		}

	}

	Destroy(muteSound: boolean = false) {
		if (this.isDestroyed) return
		this.isDestroyed = true

		Tween.setScale(this.entity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_LINEAR)
		
		if (!muteSound) SoundManager.playSound(sfx.balloonPickup, this.entity)

		utils.timers.setTimeout(() => {
			GltfNodeModifiers.createOrReplace(this.entity, {modifiers: []})

			utils.timers.setTimeout(() => {
				engine.removeEntity(this.triggerEntity)
				engine.removeEntity(this.entity)
			}, 100)
		}, 500 + (Math.floor(Math.random() * 1500)))
	}
}
