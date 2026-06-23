import { EasingFunction, engine, Entity, GltfContainer, Material, MeshRenderer, Physics, Transform, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

import { alpha, theme } from "src/client/ui"
import { IS_DEV } from "src/shared/settings"
import { sfx, SoundManager } from "../soundManager"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { ClientMessaging } from "../clientMessaging"
import { PlayerStats } from "src/server/metrics/playerStats"

export class SpeedRing {
	entity: Entity
	private pickupTriggered: boolean = false

	constructor(
		pos: Vector3,
		rotY: number
	) {
		this.entity = engine.addEntity()
		Transform.create(this.entity, { 
			position: pos, 
			rotation: Quaternion.fromEulerDegrees(0, 90+rotY, 0),
			scale: Vector3.Zero()
		})

		GltfContainer.create(this.entity, {
			src: "assets/models/boostRing.gltf"
		})
		utils.timers.setTimeout(() => {
			Tween.setScale(this.entity, Vector3.Zero(), Vector3.One(), Math.random() * 1600 + 200, EasingFunction.EF_EASEOUTBACK)
		}, Math.random() * 800 + 200)

		
		const triggerEntity = engine.addEntity()
		Transform.create(triggerEntity, { parent: this.entity, scale: Vector3.create(5, 5, 5) })

		TriggerArea.setSphere(triggerEntity)
		triggerAreaEventsSystem.onTriggerEnter(triggerEntity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				this.onTriggerEnter()
			}
			this.Destroy()
		})
		//if (IS_DEV) {
		//	MeshRenderer.setSphere(triggerEntity)
		//	Material.setPbrMaterial(triggerEntity, {
		//		albedoColor: alpha(theme.colors.info, 0.25),
		//	})
		//}
	}
	
	onTriggerEnter() {
		if (this.pickupTriggered) return
		this.pickupTriggered = true

		console.log("SpeedRing: Player entered")
		// Boost the player forwards and up
		const playerTransform = Transform.getOrNull(engine.PlayerEntity)
		if (!playerTransform) return
		
		const tiltUp = Vector3.rotate(Vector3.Forward(), Quaternion.fromEulerDegrees(-45, 0, 0))
		const playerForward = Vector3.rotate(tiltUp, playerTransform.rotation)
		
		Physics.applyImpulseToPlayer(playerForward, 64)
		SoundManager.playSound(sfx.swish)

		eventBus.emit(ClientEvents.TRIGGER_RING, undefined)
		
		ClientMessaging.RequestStatsUpdate(PlayerStats.TRIGGERED_SPEEDRINGS)
	}

	Destroy() {
		Tween.setScale(this.entity, Vector3.One(), Vector3.Zero(), 200, EasingFunction.EF_EASEINCIRC)

		utils.timers.setTimeout(() => {	
			engine.removeEntity(this.entity)
		}, 500 + (Math.floor(Math.random() * 1500)))
	}
}