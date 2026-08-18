import { engine, Entity, MeshCollider, MeshRenderer, Physics, RaycastQueryType, raycastSystem, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"


export type BounceTriggerConfig = {
	triggerPosition    : Vector3,          // REQUIRED
	triggerScale?      : Vector3,          // Default to one
	triggerRotation?   : Quaternion,       // Default to zero
	triggerShape?      : "sphere" | "box", // default to "sphere"
	triggerMaxDistance?: number,           // default to 0.15
	raycastMaxDistance?: number,           // default to 3
	meshName?          : string,           // default to empty string
	impulseDirection?  : Vector3 | null,   // default to blank
	impulseStrength?   : number,           // default to 100
}

export class BounceTrigger {

	// Configs
	private readonly RAYCAST_INTERVAL       = 0.1 // Interval at which the raycast will check

	private readonly DEBUG_LOGGING          = false
	private readonly SHOW_TRIGGER_COLLIDERS = false


	private triggerEntity: Entity
	private config: Required<BounceTriggerConfig>

	// Raycast vars
	private systemActiveRaycast: boolean = false	
	private elapsedSinceLastRaycast = 0


	// MARK: constructor
	constructor(
		config: BounceTriggerConfig
	) {
		this.config = {
			impulseDirection  : config.impulseDirection   ?? null,
			impulseStrength   : config.impulseStrength    ?? 100,
			meshName          : config.meshName           ?? "_collider",
			raycastMaxDistance: config.triggerMaxDistance ?? 3,
			triggerMaxDistance: config.triggerMaxDistance ?? 0.15,
			triggerPosition   : config.triggerPosition    ?? Vector3.Zero(),
			triggerRotation   : config.triggerRotation    ?? Quaternion.Identity(),
			triggerScale      : config.triggerScale       ?? Vector3.One(),
			triggerShape      : config.triggerShape       ?? "sphere",
		}

		// Entity + transform
		this.triggerEntity = engine.addEntity()
		Transform.create(this.triggerEntity, { 
			position: this.config.triggerPosition, 
			rotation: this.config.triggerRotation,
			scale   : this.config.triggerScale,
		})

		// Visual
		if (this.SHOW_TRIGGER_COLLIDERS) {
			if (this.config.triggerShape === "sphere") {
				MeshRenderer.setSphere(this.triggerEntity)
			} else if (this.config.triggerShape === "box") {
				MeshRenderer.setBox(this.triggerEntity)
			}
		}

		// Trigger
		if (this.config.triggerShape === "sphere") {
			TriggerArea.setSphere(this.triggerEntity)
		} else if (this.config.triggerShape === "box") {
			TriggerArea.setBox(this.triggerEntity)
		}

		// Events
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				console.log("BounceTrigger: Player entered")
				if (!this.systemActiveRaycast) {
					this.systemActiveRaycast = true
					engine.addSystem(this.sys_raycastCheck)
				}
			}
		})
		triggerAreaEventsSystem.onTriggerExit(this.triggerEntity, (e) => {
			if (e.trigger?.entity === engine.PlayerEntity) {
				console.log("BounceTrigger: Player exited")
				if (this.systemActiveRaycast) {
					this.systemActiveRaycast = false
					engine.removeSystem(this.sys_raycastCheck)
				}
			}
		})
	}

	// MARK: sys_raycast
	private sys_raycastCheck = (dt: number) => {
		if (!this.systemActiveRaycast) return

		this.elapsedSinceLastRaycast += dt
		if (this.elapsedSinceLastRaycast < this.RAYCAST_INTERVAL) return
		this.elapsedSinceLastRaycast = 0

		raycastSystem.registerGlobalDirectionRaycast(
			{
				entity: engine.PlayerEntity,
				opts: {
					queryType  : RaycastQueryType.RQT_QUERY_ALL,
					direction  : Vector3.Down(),
					maxDistance: this.config.raycastMaxDistance,
				},
			},
			(raycastResult) => {
				if (raycastResult.hits.length > 0) {
					// Find if we hit a mesh with the correct name
					for (const hit of raycastResult.hits) {
						if (hit.meshName && hit.meshName.includes(this.config.meshName)) {
							if (hit.length < this.config.triggerMaxDistance) {
								if (this.DEBUG_LOGGING) console.log("BounceTrigger: raycast hit", hit.meshName, "| distance", hit.length, "SUCCESS")

								this.systemActiveRaycast = false
								engine.removeSystem(this.sys_raycastCheck)
								
								const pos = hit.position ?? Vector3.Zero()
								const nml = Vector3.normalize(hit.normalHit ?? Vector3.Zero())
								this.DoBounce(pos, nml)
							} else {
								if (this.DEBUG_LOGGING) console.log("BounceTrigger: raycast hit", hit.meshName, "| distance", hit.length, "(too far)")
							}
							break
						}
					}
					if (this.DEBUG_LOGGING) {
						const meshNames = raycastResult.hits.map(hit => hit.meshName).join(", ")
						console.log("BounceTrigger: raycast hit", raycastResult.hits.length, "| mesh not found:", this.config.meshName, "| meshes:", meshNames)
					}
				} else {
					if (this.DEBUG_LOGGING) console.log("BounceTrigger: raycast hit", raycastResult.hits.length)
				}
			}
		)
	}

	// MARK: DoBounce
	private DoBounce(position: Vector3, normal: Vector3) {
		console.log("BounceTrigger: Bounce")
		if (this.config.impulseDirection) {
			Physics.applyImpulseToPlayer(this.config.impulseDirection, this.config.impulseStrength)
		} else {
			Physics.applyImpulseToPlayer(normal, this.config.impulseStrength)
		}

		this.OnBounce(position, normal)
	}
	
	// MARK: OnBounce
	protected OnBounce(position: Vector3, normal: Vector3) {
		/// Override this in the subclass
	}
}
