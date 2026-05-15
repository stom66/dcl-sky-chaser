import { EasingFunction, engine, Entity, Material, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { ComponentStore } from "src/shared/components/componentStore"
import { FuelPickup as FuelPickupComponent } from "src/shared/components/fuelPickup"

import { theme } from "../ui"
import { sfx, SoundManager } from "../soundManager"
import { ClientMessaging } from "../clientMessaging"

export class FuelPickup {
	private entity: Entity

    constructor(
		public position: Vector3, 
		public amount  : number
	) {

		this.entity = engine.addEntity()
		FuelPickupComponent.create(this.entity, { amount: this.amount })
		Transform.create(this.entity, { 
			position: this.position 
		})
		MeshRenderer.setSphere(this.entity)
		Material.setPbrMaterial(this.entity, { 
			albedoColor: theme.colors.success 
		})

		TriggerArea.setSphere(this.entity)
		triggerAreaEventsSystem.onTriggerEnter(this.entity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				this.onTriggerEnter()
			}
		})
    }

	onTriggerEnter() {
		console.log("FuelPickup: Player entered")
		ComponentStore.increaseFuelValue(this.amount)
		SoundManager.playSound(sfx.fuelPickup)
		ClientMessaging.RequestScoreUpdate()
		this.Destroy()
	}

	Destroy() {
		Tween.setScale(this.entity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_LINEAR)

		utils.timers.setTimeout(() => {	
			engine.removeEntity(this.entity)
		}, 300)
	}
}
