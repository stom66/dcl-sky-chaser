import { engine, Entity, Material, MeshRenderer, Physics, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { GameSettings } from "src/shared/settings"
import { FuelPickupComponent } from "./fuelPickup"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { ProjectileComponent } from "src/shared/components/projectile"

const HIDE_LOCATION = Vector3.create(128, -100, 128)
const EXPLOSION_RADIUS_SQUARED = 100

export class Projectile {
	entity: Entity

	origin   : Vector3
	direction: Vector3
	speed    : number
	active   : boolean
	age      : number

	constructor(origin: Vector3) {
		this.origin    = origin
		this.direction = Vector3.Zero()
		this.speed     = GameSettings.PROJECTILE_SPEED
		this.active    = false
		this.age       = 0

		this.entity = engine.addEntity()

		Transform.create(this.entity, { 
			position: origin, 
			rotation: Quaternion.Identity() ,
			scale   : Vector3.create(1, 1, 1)
		})

		ProjectileComponent.create(this.entity, { owner: "" })

		MeshRenderer.setSphere(this.entity)
		Material.setPbrMaterial(this.entity, { albedoColor: Color4.Yellow() })

		TriggerArea.setSphere(this.entity)
		triggerAreaEventsSystem.onTriggerEnter(this.entity, (e) => {
			if (e.trigger?.entity !== engine.PlayerEntity) {
				this.onTriggerEnter(e.trigger?.entity as Entity)
			}
		})
	}

	onTriggerEnter(triggerEntity: Entity | undefined) : void {
		console.log("Projectile: onTriggerEnter")
		
		// Is the  thing we hit a fuel tank?
		if (triggerEntity) {
			// Is it fuel?	
			if (FuelPickupComponent.has(triggerEntity)) {
				const t = Transform.getOrNull(this.entity)
				if (t === null) return

				eventBus.emit(ClientEvents.TRIGGER_EXPLOSION, {position: t.position})

				// Are we close to the explosion? Should we knockback the player?
				const playerPosition = Transform.getOrNull(engine.PlayerEntity)?.position
				if (playerPosition) {
					const distanceSquared = Vector3.distanceSquared(t.position, playerPosition)
					if (distanceSquared < EXPLOSION_RADIUS_SQUARED) {
						const ratio = distanceSquared / EXPLOSION_RADIUS_SQUARED;
						Physics.applyImpulseToPlayer(Vector3.subtract(playerPosition, t.position), ratio * 50)
					}
				}
			}
		}

		this.Disable()
	}

	public isActive() : boolean {
		return this.active
	}

	public Fire(
		origin   : Vector3, 
		direction: Vector3,
		owner   : string
	): void {
		this.age       = 0
		this.origin    = origin
		this.direction = direction
		
		const t = Transform.getMutableOrNull(this.entity)
		if (t === null) return
		t.position = origin
		t.rotation = Quaternion.lookRotation(direction)

		this.active    = true

		const p = ProjectileComponent.getMutableOrNull(this.entity)
		if (p === null) return
		p.owner = owner
	}

	public MoveForward(dt: number) : void {
		this.age += dt
		if (this.age > GameSettings.PROJECTILE_LIFETIME) {
			this.active = false
			this.Disable()
			return
		}

		const t = Transform.getMutableOrNull(this.entity)
		if (t === null) return

		const newPosition = Vector3.add(t.position, Vector3.scale(this.direction, this.speed * dt))
		t.position = newPosition
	}

	Disable() : void {
		const t = Transform.getMutableOrNull(this.entity)
		if (t === null) return
		t.position = HIDE_LOCATION
		this.active = false

		const p = ProjectileComponent.getMutableOrNull(this.entity)
		if (p === null) return
		p.owner = ""
	}
}