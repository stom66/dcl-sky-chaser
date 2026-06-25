import { ColliderLayer, EasingFunction, engine, Entity, GltfContainer, GltfNodeModifiers, Material, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { ComponentStore } from "src/shared/components/componentStore"
import { FuelPickupComponent, FuelPickupChildComponent } from "src/shared/components/fuelPickup"
export { FuelPickupComponent, FuelPickupChildComponent }

import { theme } from "../ui"
import { sfx, SoundManager } from "../soundManager"
import { ClientMessaging } from "../clientMessaging"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { PlayerStats } from "src/server/metrics/playerStats"
import { ParticleSpawner } from "../particleSpawner"

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
		Tween.setScale(this.rootEntity, Vector3.Zero(), this.meshScaleVector3, 200, EasingFunction.EF_EASEOUTBACK)

		// Child entity - top fan model
		this.childEntity = engine.addEntity()
		Transform.create(this.childEntity, { parent: this.rootEntity })
		FuelPickupChildComponent.create(this.childEntity)
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
		TriggerArea.setSphere(this.triggerEntity)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				this.onTriggerEnter()
			}
			this.Destroy()
		})

    }

	onTriggerEnter() {
		if (this.pickupTriggered) return
		this.pickupTriggered = true

		console.log("FuelPickup: Player entered")
		ComponentStore.increaseFuelValue(this.amount)
		SoundManager.playSound(sfx.fuelPickup)
		
		eventBus.emit(ClientEvents.TRIGGER_FUEL, {position: this.position, amount: this.amount})
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
