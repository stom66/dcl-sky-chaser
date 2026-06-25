import { ColliderLayer, EasingFunction, engine, Entity, GltfContainer, GltfNodeModifiers, Material, MeshCollider, MeshRenderer, Physics, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { ComponentStore } from "src/shared/components/componentStore"
import { FuelPickupComponent, FuelPickupChildComponent } from "src/shared/components/fuelPickup"
import { ProjectileComponent } from "src/shared/components/projectile"
export { FuelPickupComponent, FuelPickupChildComponent }

import { theme } from "../ui"
import { sfx, SoundManager } from "../soundManager"
import { ClientMessaging } from "../clientMessaging"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { PlayerStats } from "src/server/metrics/playerStats"
import { ParticleSpawner } from "../particleSpawner"

const EXPLOSION_RADIUS_SQUARED = 1600

export class FuelPickup {
	private rootEntity         : Entity
	private childEntity        : Entity
	private triggerEntity      : Entity
	private meshScale          : number  = 1.75
	private triggerScale       : number  = 2.5

	private pickupTriggered    : boolean = false
	private isDestroyed        : boolean = false

	private meshScaleVector3   : Vector3 = Vector3.create(this.meshScale, this.meshScale, this.meshScale)
	private triggerScaleVector3: Vector3 = Vector3.create(this.triggerScale, this.triggerScale, this.triggerScale)

    constructor(
		public position: Vector3, 
		public amount  : number
	) {

		// Root entity - main barrel model
		this.rootEntity = engine.addEntity()
		FuelPickupComponent.create(this.rootEntity, { amount: this.amount })
		Transform.create(this.rootEntity, { 
			position: this.position,
			rotation: Quaternion.fromEulerDegrees(0, Math.random() * 360, 0),
			scale   : Vector3.Zero()
		})
		GltfContainer.create(this.rootEntity, {
			src: "assets/models/fuel.gltf", 
			visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
		})
		MeshCollider.setSphere(this.rootEntity, ColliderLayer.CL_CUSTOM2)
		Tween.setScale(this.rootEntity, Vector3.Zero(), this.meshScaleVector3, 200, EasingFunction.EF_EASEOUTBACK)


		// Child entity - top fan model
		this.childEntity = engine.addEntity()
		Transform.create(this.childEntity, { parent: this.rootEntity })
		GltfContainer.create(this.childEntity, {
			src: "assets/models/fuelTop.gltf", 
			visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
		})

		
		// Trigger entity - for player interaction
		this.triggerEntity = engine.addEntity()
		Transform.create(this.triggerEntity, { 
			parent: this.rootEntity, 
			scale : this.triggerScaleVector3
		})
		TriggerArea.setSphere(this.triggerEntity, ColliderLayer.CL_PLAYER | ColliderLayer.CL_CUSTOM1)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			const triggerEntity = e.trigger?.entity as Entity | undefined

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
		})

    }

	// MARK: onHitByPlayer
	onHitByPlayer() {
		if (this.pickupTriggered) return
		this.pickupTriggered = true

		console.log("FuelPickup: Player entered")
		ComponentStore.increaseFuelValue(this.amount)
		SoundManager.playSound(sfx.fuelPickup)
		
		eventBus.emit(ClientEvents.TRIGGER_FUEL, {position: this.position, amount: this.amount})
	}


	// MARK: onHitByProjectile
	onHitByProjectile(
		entity: Entity
	) : void {
		if (this.isDestroyed) return

		eventBus.emit(ClientEvents.PROJECTILE_HIT_FUEL, { 
			fuelPosition    : this.position, 
			projectileEntity: entity, 
			projectileOwner : ProjectileComponent.getOrNull(entity)?.owner ?? "" 
		})
		eventBus.emit(ClientEvents.TRIGGER_EXPLOSION, { position: this.position })

		SoundManager.playSound(sfx.boom, this.rootEntity)
		SoundManager.playSound(sfx.coo, this.rootEntity)

		const playerPosition = Transform.getOrNull(engine.PlayerEntity)?.position
		if (playerPosition) {
			const distanceSquared = Vector3.distanceSquared(this.position, playerPosition)
			if (distanceSquared < EXPLOSION_RADIUS_SQUARED) {
				const ratio = distanceSquared / EXPLOSION_RADIUS_SQUARED
				Physics.applyImpulseToPlayer(Vector3.subtract(playerPosition, this.position), ratio * 50)
			}
		}
	}

	Destroy() {
		if (this.isDestroyed) return
		this.isDestroyed = true

		Tween.setScale(this.rootEntity, this.meshScaleVector3, Vector3.Zero(), 200, EasingFunction.EF_LINEAR)

		utils.timers.setTimeout(() => {	
			engine.removeEntity(this.triggerEntity)
			engine.removeEntity(this.childEntity)
			engine.removeEntity(this.rootEntity)
		}, 500 + (Math.floor(Math.random() * 1500)))
	}
}
