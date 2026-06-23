import { engine, Entity, Material, MeshRenderer, Physics, RaycastQueryType, raycastSystem, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import { sfx, SoundManager } from "./soundManager"
import { ParticleSpawner } from "./particleSpawner"
import { ClientMessaging } from "./clientMessaging"
import { PlayerStats } from "src/server/metrics/playerStats"

export namespace UmbrellaBouncer {

	const TRIGGER_SIZE     = 8
	const TRIGGER_DISTANCE = 0.11
	const RAYCAST_INTERVAL = 0.1
	let elapsedSinceLastRaycast = 0

	const positions = [
		Vector3.create(251.58, 66.5, 270.464),
		Vector3.create(280.702, 43.2052, 259.898),
	]

	export function init() {
		console.log("UmbrellaBouncer: init")

		for (const position of positions) {
			createUmbrella(position)
		}
	}

	function createUmbrella(position: Vector3) {
		const umbrella = engine.addEntity()
		Transform.create(umbrella, { 
			position: position,
			scale: Vector3.create(TRIGGER_SIZE, TRIGGER_SIZE, TRIGGER_SIZE),
		})
		//MeshRenderer.setSphere(umbrella)
		Material.setPbrMaterial(umbrella, {
			alphaTest: 0
		})
		TriggerArea.setSphere(umbrella)
		triggerAreaEventsSystem.onTriggerEnter(umbrella, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				onUmbrellaTriggerEnter(umbrella)
			}
		})
		triggerAreaEventsSystem.onTriggerExit(umbrella, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				onUmbrellaTriggerExit(umbrella)
			}
		})
	}

	function onUmbrellaTriggerEnter(umbrella: Entity) {
		console.log("UmbrellaBouncer: umbrella trigger entered", umbrella)
		engine.addSystem(system_raycastCheck)
	}

	function onUmbrellaTriggerExit(umbrella: Entity) {
		console.log("UmbrellaBouncer: umbrella trigger exited", umbrella)
		engine.removeSystem(system_raycastCheck)
	}

	function system_raycastCheck(dt: number) {
		elapsedSinceLastRaycast += dt
		if (elapsedSinceLastRaycast < RAYCAST_INTERVAL) {
			return
		}
		elapsedSinceLastRaycast = 0

		raycastSystem.registerGlobalDirectionRaycast(
			{
				entity: engine.PlayerEntity,
				opts: {
					queryType  : RaycastQueryType.RQT_QUERY_ALL,
					direction  : Vector3.Down(),
					maxDistance: 3,
				},
			},
			function (raycastResult) {
				if (raycastResult.hits.length > 0) {
					// Find if we hit an umbrella
					console.log("UmbrellaBouncer: raycast hits", raycastResult.hits.length)
					for (const hit of raycastResult.hits) {
						console.log("UmbrellaBouncer: raycast hit", hit.meshName, "distance", hit.length)
						if (hit.meshName && hit.meshName.includes("parasol")) {
							console.log("UmbrellaBouncer: raycast hit umbrella", hit.meshName, "distance", hit.length)
							if (hit.length < TRIGGER_DISTANCE) {
								const strength = 200 - (hit.position?.y ?? 0)
								launchPlayer(strength)
								engine.removeSystem(system_raycastCheck)
							}
							break
						}
					}
				}
			}
		)
	}

	function launchPlayer(strength: number) {
		Physics.applyImpulseToPlayer(Vector3.Up(), strength)
		SoundManager.playSound(sfx.boing)
		ParticleSpawner.TriggerDustSpurt(Transform.getOrNull(engine.PlayerEntity)?.position ?? Vector3.create(256, 63.2, 256))

		ClientMessaging.RequestStatsUpdate(PlayerStats.TRIGGERED_UMBRELLAS)
	}

}