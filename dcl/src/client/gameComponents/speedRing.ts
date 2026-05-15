import { EasingFunction, engine, Entity, GltfContainer, Material, MeshRenderer, Physics, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { alpha, theme } from "src/client/ui"
import { IS_DEV } from "src/shared/settings"
import { sfx, SoundManager } from "../soundManager"

export class SpeedRing {
	entity: Entity

	constructor(
		pos: Vector3
	) {
		this.entity = engine.addEntity()
		Transform.create(this.entity, { 
			position: pos, 
			rotation: Quaternion.fromEulerDegrees(0, 90, 0),
			scale: Vector3.Zero()
		})

		GltfContainer.create(this.entity, {
			src: "assets/models/boostRing.gltf"
		})
		utils.timers.setTimeout(() => {
			Tween.setScale(this.entity, Vector3.Zero(), Vector3.One(), Math.random() * 1600 + 200, EasingFunction.EF_EASEOUTBACK)
		}, Math.random() * 800 + 200)

		
		const triggerEntity = engine.addEntity()
		Transform.create(triggerEntity, { parent: this.entity, scale: Vector3.create(4, 4, 4) })

		TriggerArea.setSphere(triggerEntity)
		triggerAreaEventsSystem.onTriggerEnter(triggerEntity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				this.onTriggerEnter()
			}
		})
		if (IS_DEV) {
			MeshRenderer.setSphere(triggerEntity)
			Material.setPbrMaterial(triggerEntity, {
				albedoColor: alpha(theme.colors.info, 0.25),
			})
		}
	}
	
	onTriggerEnter() {
		console.log("SpeedRing: Player entered")
		// Boost the player forwards and up
		const playerTransform = Transform.get(engine.PlayerEntity)
		const tiltUp = Vector3.rotate(Vector3.Forward(), Quaternion.fromEulerDegrees(-45, 0, 0))
		const playerForward = Vector3.rotate(tiltUp, playerTransform.rotation)
		
		Physics.applyImpulseToPlayer(playerForward, 64)
		SoundManager.playSound(sfx.swish)
	}

	Destroy() {
		Tween.setScale(this.entity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_EASEINCIRC)

		utils.timers.setTimeout(() => {	
			engine.removeEntity(this.entity)
		}, 300)
	}
}