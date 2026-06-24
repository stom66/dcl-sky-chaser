import { EasingFunction, engine, Entity, GltfContainer, GltfNodeModifiers, Material, MeshRenderer, PBMaterial, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { ComponentStore } from "src/shared/components/componentStore"
import { BalloonPickup as BalloonPickupComponent } from "src/shared/components/balloonPickup"

import { darken, lighten, theme } from "../ui"
import { sfx, SoundManager } from "../soundManager"
import { ClientMessaging } from "../clientMessaging"
import { PlayerStats } from "src/server/metrics/playerStats"
import { ParticleSpawner } from "../particleSpawner"

export class BalloonPickup {
	public entity: Entity
	private triggerEntity: Entity
	private startPosition: Vector3

	private defaultValue: number = 1
	private triggerScale: number = 3.5

	private SHOW_TRIGGER: boolean = false

	private pickupTriggered: boolean = false
	private isDestroyed    : boolean = false

	private randomIndex: number = Math.floor(Math.random() * 4) + 1

    constructor(
		public position : Vector3, 
		public packageColor: Color4 = theme.colors.warning,
		public balloonColor: Color4 = theme.colors.warning,
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
			src: `assets/models/balloon_0${this.randomIndex}.gltf`
		})

		// Define materials
		const materialBalloonOverRide = {
			$case: "pbr",
			pbr: {
				albedoColor: this.balloonColor,
				emissiveColor: this.balloonColor,
				emissiveIntensity: 0.3
			}
		} as PBMaterial["material"]

		const materialPackageOverRide = {
			$case: "pbr",
			pbr: {
				albedoColor: this.packageColor,
				emissiveColor: this.packageColor,
				emissiveIntensity: 0.3
			}
		} as PBMaterial["material"]

		// Each balloon_0X model contains exactly one balloon node and one package
		// node, both numbered to match the model index (e.g. balloon_03 has
		// balloon.003 and package.003). Modifiers must only target nodes that
		// exist in the loaded model, otherwise the Explorer's ResetMaterialSystem
		// crashes when the entity is destroyed.
		const nodeSuffix = String(this.randomIndex).padStart(3, "0")
		GltfNodeModifiers.create(this.entity, {
			modifiers: [
				{
					path: `balloon.${nodeSuffix}`,
					material: {
						material: materialBalloonOverRide
					}
				},
				{
					path: `package.${nodeSuffix}`,
					material: {
						material: materialPackageOverRide
					}
				}
			]
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

		ParticleSpawner.TriggerPickupBalloon(this.position)

		ClientMessaging.RequestStatsUpdate(PlayerStats.COLLECTED_POINTS, this.getValue() * combo)
		ClientMessaging.RequestStatsUpdate(PlayerStats.COLLECTED_BALLOONS)
	}

	Destroy(muteSound: boolean = false) {
		if (this.isDestroyed) return
		this.isDestroyed = true

		Tween.setScale(this.entity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_LINEAR)
		
		if (!muteSound) SoundManager.playSound(sfx.balloonPickup, this.entity, 64)

		utils.timers.setTimeout(() => {
			GltfNodeModifiers.createOrReplace(this.entity, {modifiers: []})

			utils.timers.setTimeout(() => {
				engine.removeEntity(this.triggerEntity)
				engine.removeEntity(this.entity)
			}, 100)
		}, 500 + (Math.floor(Math.random() * 1500)))
	}
}
