import { EasingFunction, engine, Entity, GltfContainer, GltfNodeModifiers, Material, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { ComponentStore } from "src/shared/components/componentStore"
import { FuelPickup as FuelPickupComponent } from "src/shared/components/fuelPickup"

import { theme } from "../ui"
import { sfx, SoundManager } from "../soundManager"
import { ClientMessaging } from "../clientMessaging"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export class FuelPickup {
	private entity       : Entity
	private triggerEntity: Entity
	private meshScale    : number = 1.75
	private triggerScale : number = 2

    constructor(
		public position: Vector3, 
		public amount  : number
	) {

		this.entity = engine.addEntity()
		FuelPickupComponent.create(this.entity, { amount: this.amount })
		Transform.create(this.entity, { 
			position: this.position,
			scale: Vector3.create(this.meshScale, this.meshScale, this.meshScale)
		})

		this.triggerEntity = engine.addEntity()
		Transform.create(this.triggerEntity, { parent: this.entity, scale: Vector3.create(this.triggerScale, this.triggerScale, this.triggerScale) })
		TriggerArea.setSphere(this.triggerEntity)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				this.onTriggerEnter()
			}
			this.Destroy()
		})

		
		GltfContainer.create(this.entity, {
			src: "assets/models/fuel.gltf"
		})
		GltfNodeModifiers.create(this.entity, {
			modifiers: [
				{
					path: "",
					material: {
						material: {
							$case: "pbr",
							pbr: {
								albedoColor: theme.colors.success,
								emissiveColor: theme.colors.success,
								emissiveIntensity: 0.3
							}
						}
					}
				}
			]
		})
		//MeshRenderer.setSphere(this.triggerEntity)
		//Material.setPbrMaterial(this.triggerEntity, { 
		//	albedoColor      : theme.colors.success,
		//	emissiveColor    : theme.colors.success,
		//	emissiveIntensity: 0.2
		//})
    }

	onTriggerEnter() {
		console.log("FuelPickup: Player entered")
		ComponentStore.increaseFuelValue(this.amount)
		SoundManager.playSound(sfx.fuelPickup)
		//ClientMessaging.RequestScoreUpdate()
		
		eventBus.emit(ClientEvents.TRIGGER_FUEL, undefined)
	}

	Destroy() {
		Tween.setScale(this.entity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_LINEAR)

		utils.timers.setTimeout(() => {	
			engine.removeEntity(this.entity)
		}, 300)
	}
}
