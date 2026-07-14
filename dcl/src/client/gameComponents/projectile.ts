import { ColliderLayer, engine, Entity, GltfContainer, Material, MeshCollider, MeshRenderer, ParticleSystem, PBParticleSystem_BlendMode, Physics, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { GameSettings } from "src/shared/settings"
import { ProjectileComponent } from "src/shared/components/projectile"
import { sfx, SoundManager } from "../soundManager"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

const HIDE_LOCATION = Vector3.create(128, -100, 128)
const PLAYER_HIT_IMPULSE = 50

export class Projectile {
	entity: Entity

	origin   : Vector3
	direction: Vector3
	speed    : number
	active   : boolean
	age      : number
	lifetime : number
	owner    : string

	constructor(origin: Vector3) {
		this.origin    = origin
		this.direction = Vector3.Zero()
		this.speed     = GameSettings.PROJECTILE_SPEED
		this.active    = false
		this.age       = 0
		this.lifetime  = GameSettings.PROJECTILE_LIFETIME
		this.owner     = ""

		this.entity = engine.addEntity()

		Transform.create(this.entity, { 
			position: origin, 
			rotation: Quaternion.Identity() ,
			scale   : Vector3.create(1, 1, 1)
		})

		ProjectileComponent.create(this.entity, { owner: "" })

		MeshCollider.setSphere(this.entity, ColliderLayer.CL_CUSTOM1)

		GltfContainer.create(this.entity, {
			src: "assets/models/projectile01.gltf"
		})

		//MeshRenderer.setSphere(this.entity)
		//Material.setPbrMaterial(this.entity, { albedoColor: Color4.Yellow() })

		TriggerArea.setSphere(this.entity, ColliderLayer.CL_PLAYER | ColliderLayer.CL_CUSTOM2)
		triggerAreaEventsSystem.onTriggerEnter(this.entity, (e) => {
			this.onTriggerEnter(e.trigger?.entity as Entity | undefined)
		})
	}

	createParticleSystem() {
		if (!this.entity) return

		console.log("ParticleSpawner: creating particle system")

		ParticleSystem.create(this.entity, {
			active              : true,
			loop                : true,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 50,
			lifetime            : 2,
			maxParticles        : 400,
			gravity             : 0,
			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Cone({ 
				angle : 15, 
				radius: 0.05 
			}),
			initialVelocitySpeed: { 
				start: -3, 
				end  : -9 
			},
			initialSize: { 
				start: 0.08, 
				end  : 0.10 
			},
			sizeOverTime: { 
				start: 1, 
				end  : 0 
			},
			initialColor: { 
				start: Color4.create(0.827, 0.604, 0.125, 1.000), 
				end  : Color4.create(0.800, 0.800, 0.800, 1.000) 
			},
			colorOverTime: { 
				start: Color4.create(1.000, 0.800, 0.500, 1.000), 
				end  : Color4.create(0.200, 0.200, 0.200, 1.000) 
			},
		})
	}

	// MARK: onTriggerEnter
	onTriggerEnter(triggerEntity: Entity | undefined) : void {
		console.log("Projectile: onTriggerEnter")
		
		if (triggerEntity === engine.PlayerEntity && this.owner === "") {
			// Hit self with own projectile?
			return
		}

		if (triggerEntity === engine.PlayerEntity) {
			// Someone else hit us
			this.onHitPlayer()
			this.Disable()
		}

	}

	// MARK: isActive
	public isActive() : boolean {
		return this.active
	}


	// MARK: Fire
	public Fire(
		origin   : Vector3, 
		direction: Vector3,
		owner   : string
	): void {
		const normalizedOwner = owner ?? ""

		this.age       = 0
		this.origin    = origin
		this.direction = direction
		this.owner     = normalizedOwner
		
		const p = ProjectileComponent.getMutableOrNull(this.entity)
		if (p === null) return
		p.owner = normalizedOwner
		
		const t = Transform.getMutableOrNull(this.entity)
		if (t === null) return
		t.position = origin
		t.rotation = Quaternion.lookRotation(direction)

		this.active    = true

		SoundManager.playSound(sfx.coo, this.entity)

		this.createParticleSystem()
	}

	// MARK: MoveForward
	public MoveForward(dt: number) : void {
		this.age += dt
		if (this.age > this.lifetime) {
			this.active = false
			this.Disable()
			return
		}

		const t = Transform.getMutableOrNull(this.entity)
		if (t === null) return

		const newPosition = Vector3.add(t.position, Vector3.scale(this.direction, this.speed * dt))
		t.position = newPosition
	}

	// MARK: Disable
	Disable() : void {
		const t = Transform.getMutableOrNull(this.entity)
		if (t === null) return
		t.position = HIDE_LOCATION
		this.active = false
		this.owner = ""

		const p = ProjectileComponent.getMutableOrNull(this.entity)
		if (p === null) return
		p.owner = ""

		ParticleSystem.deleteFrom(this.entity)
	}

	// MARK: onHitPlayer
	onHitPlayer() : void {
		const projectileComponent = ProjectileComponent.getOrNull(this.entity)
		if (projectileComponent === null) return
		if (projectileComponent.owner === "") return

		// If here, we got hit by another player		
		const playerPosition = Transform.getOrNull(engine.PlayerEntity)?.position
		const t = Transform.getOrNull(this.entity)
		if (!playerPosition || t === null) return

		const impulseDirection = Vector3.normalize(Vector3.subtract(t.position, playerPosition))
		Physics.applyImpulseToPlayer(impulseDirection, PLAYER_HIT_IMPULSE)
		
		eventBus.emit(ClientEvents.PROJECTILE_HIT_PLAYER, {
			projectileOwner: projectileComponent.owner,
			position: t.position
		})
	}
}