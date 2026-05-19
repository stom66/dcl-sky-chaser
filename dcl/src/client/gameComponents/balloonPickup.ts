import { EasingFunction, engine, Entity, GltfContainer, GltfNodeModifiers, Material, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { ComponentStore } from "src/shared/components/componentStore"
import { BalloonPickup as BalloonPickupComponent } from "src/shared/components/balloonPickup"

import { theme } from "../ui"
import { sfx, SoundManager } from "../soundManager"
import { ClientMessaging } from "../clientMessaging"

export class BalloonPickup {
	public entity: Entity
	private triggerEntity: Entity
	private startPosition: Vector3

	private defaultValue: number = 1
	private triggerScale: number = 3.5

	private SHOW_TRIGGER: boolean = false

	private pickupTriggered: boolean = false

    constructor(
		public position : Vector3, 
		public value    : number = this.defaultValue,
		public maxHeight: number = 200,
		public riseSpeed: number = Math.random() * 4 + 0.1
	) {

		this.entity = engine.addEntity()
		BalloonPickupComponent.create(this.entity, { 
			value    : this.value,
			riseSpeed: this.riseSpeed
		})

		this.startPosition = this.position
		Transform.create(this.entity, { 
			position: this.position 
		})

		GltfContainer.create(this.entity, {
			src: "assets/models/balloon.gltf"
		})
		GltfNodeModifiers.create(this.entity, {
			modifiers: [
				{
					path: "",
					material: {
						material: {
							$case: "pbr",
							pbr: {
								albedoColor: theme.colors.warning,
								emissiveColor: theme.colors.warning,
								emissiveIntensity: 0.3
							}
						}
					}
				}
			]
		})
		//MeshRenderer.setSphere(this.entity)
		//Material.setPbrMaterial(this.entity, { 
		//	albedoColor      : theme.colors.warning,
		//	emissiveColor    : theme.colors.warning,
		//	emissiveIntensity: 0.2
		//})

		this.triggerEntity = engine.addEntity()
		Transform.create(this.triggerEntity, { parent: this.entity, scale: Vector3.create(this.triggerScale, this.triggerScale, this.triggerScale) })

		TriggerArea.setSphere(this.triggerEntity)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				this.onTriggerEnter()
			}
			this.Destroy()
		})

		if (this.SHOW_TRIGGER) {
			MeshRenderer.setSphere(this.triggerEntity)
			Material.setPbrMaterial(this.triggerEntity, { 
				albedoColor      : theme.colors.warning,
				emissiveColor    : theme.colors.warning,
				emissiveIntensity: 0.2
			})
		}
    }

	getValue() {
		const c = BalloonPickupComponent.get(this.entity)
		return c?.value ?? this.defaultValue
	}

	onTriggerEnter() {
		if (this.pickupTriggered) return
		this.pickupTriggered = true

		console.log("BalloonPickup: Player entered")
		const combo = ComponentStore.getComboValue()
		ClientMessaging.RequestScoreUpdate(this.getValue() * combo)
	}

	Destroy(muteSound: boolean = false) {
		Tween.setScale(this.entity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_LINEAR)
		SoundManager.playSound(sfx.balloonPickup, this.entity, 64)

		utils.timers.setTimeout(() => {	
			engine.removeEntity(this.entity)
		}, 1000)
	}
}
