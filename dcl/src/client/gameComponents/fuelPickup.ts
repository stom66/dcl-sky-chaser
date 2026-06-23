import { ColliderLayer, EasingFunction, engine, Entity, GltfContainer, GltfNodeModifiers, Material, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { ComponentStore } from "src/shared/components/componentStore"
import { FuelPickup as FuelPickupComponent } from "src/shared/components/fuelPickup"

import { theme } from "../ui"
import { sfx, SoundManager } from "../soundManager"
import { ClientMessaging } from "../clientMessaging"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { PlayerStats } from "src/server/metrics/playerStats"

export class FuelPickup {
	private entity       : Entity
	private triggerEntity: Entity
	private meshScale    : number = 1.75
	private triggerScale : number = 2

	private pickupTriggered: boolean = false
	private isDestroyed    : boolean = false

	private meshScaleVector3   : Vector3 = Vector3.create(this.meshScale, this.meshScale, this.meshScale)
	private triggerScaleVector3: Vector3 = Vector3.create(this.triggerScale, this.triggerScale, this.triggerScale)

    constructor(
		public position: Vector3, 
		public amount  : number
	) {

		this.entity = engine.addEntity()
		FuelPickupComponent.create(this.entity, { amount: this.amount })
		Transform.create(this.entity, { 
			position: this.position,
			scale   : Vector3.Zero()
		})
		Tween.setScale(this.entity, Vector3.Zero(), this.meshScaleVector3, 200, EasingFunction.EF_EASEOUTBACK)

		this.triggerEntity = engine.addEntity()
		Transform.create(this.triggerEntity, { 
			parent: this.entity, 
			scale : this.triggerScaleVector3
		})
		TriggerArea.setSphere(this.triggerEntity)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				this.onTriggerEnter()
			}
			this.Destroy()
		})

		GltfContainer.create(this.entity, {
			src: "assets/models/fuel.gltf", 
			visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
		})

    }

	onTriggerEnter() {
		if (this.pickupTriggered) return
		this.pickupTriggered = true

		console.log("FuelPickup: Player entered")
		ComponentStore.increaseFuelValue(this.amount)
		SoundManager.playSound(sfx.fuelPickup)

		ClientMessaging.RequestStatsUpdate(PlayerStats.COLLECTED_FUEL, this.amount)
		
		eventBus.emit(ClientEvents.TRIGGER_FUEL, undefined)
	}

	Destroy() {
		if (this.isDestroyed) return
		this.isDestroyed = true

		Tween.setScale(this.entity, this.meshScaleVector3, Vector3.Zero(), 200, EasingFunction.EF_LINEAR)

		utils.timers.setTimeout(() => {	
			engine.removeEntity(this.triggerEntity)
			engine.removeEntity(this.entity)
		}, 500 + (Math.floor(Math.random() * 1500)))
	}
}
