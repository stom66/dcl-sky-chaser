import { engine, Entity, Material, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs"
import { Color4, Vector3 } from "@dcl/sdk/math"

import { IS_DEV } from "src/shared/settings"

import { alpha, theme } from "src/client/ui-old"
import { PlayerMover } from "src/client/playerMover"


export class DeathTrigger {
	entity: Entity

    constructor(
		pos  : Vector3,
		scale: Vector3
	) {
		console.log("DeathTrigger: constructor")

		this.entity = engine.addEntity()
		Transform.create(this.entity, { position: pos, scale: scale })
		TriggerArea.setBox(this.entity)
		triggerAreaEventsSystem.onTriggerEnter(this.entity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				this.onTriggerEnter()
			}
		})

		if (IS_DEV) {
			//MeshRenderer.setBox(this.entity)
			//Material.setBasicMaterial(this.entity, {
			//	diffuseColor: alpha(theme.colors.danger, 0.25)
			//})
		}
	}

	onTriggerEnter() {
		console.log("DeathTrigger: Player entered")
		PlayerMover.movePlayerToSpawn()
		// TODO: show a death UI
	}
}
