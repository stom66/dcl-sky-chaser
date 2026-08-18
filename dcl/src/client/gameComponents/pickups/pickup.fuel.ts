import { ColliderLayer, EasingFunction, engine, Entity, GltfContainer, MeshCollider, Physics, Transform, TransformType, TriggerArea, triggerAreaEventsSystem, Tween } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { isMobile } from "@dcl/sdk/platform"
import * as utils from '@dcl-sdk/utils'

import { ComponentStore } from "src/shared/components/componentStore"
import { FuelPickupChildComponent, FuelPickupComponent } from "src/shared/components/fuelPickup"
import { ProjectileComponent } from "src/shared/components/projectile"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { PlayerStatsEnum } from "src/shared/metrics/playerStats"

import { ClientMessaging } from "src/client/clientMessaging"
import { Pickup } from "src/client/gameComponents/pickups/pickup"
import { sfx, SoundManager } from "src/client/soundManager"
import { showFuelToast } from "src/client/ui/themes/skyChaser/pickupToasts"

const EXPLOSION_RADIUS_SQUARED = 30 * 30

// MARK: PickupFuel
export class PickupFuel extends Pickup {
	private childEntity   : Entity
	private triggerEntity : Entity | undefined

	private defaultValue  : number  = 30
	private spinSpeed     : number  = 360
	private meshScale     : number  = 1.75
	private triggerScale  : number  = 2.5

	private animateDurationActivate  : number = 3000
	private animateDurationDeactivate: number = 1000
	private animationTimeElapsed     : number = Math.random() * 5
	private animateYOffset           : boolean = false

	private meshScaleV3   : Vector3 = Vector3.create(this.meshScale, this.meshScale, this.meshScale)
	private triggerScaleV3: Vector3 = Vector3.create(this.triggerScale, this.triggerScale, this.triggerScale)
	
	private MODEL_SUFFIX = isMobile() ? "_mobile" : "_desktop"


	// MARK: constructor
	constructor(
		public defaultPosition: Vector3,
	) {
		super(defaultPosition)

		GltfContainer.create(this.rootEntity, {
			src                       : `assets/models/fuel${this.MODEL_SUFFIX}.gltf`,
			visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
		})
		MeshCollider.setSphere(this.rootEntity, ColliderLayer.CL_CUSTOM2)
		FuelPickupComponent.create(this.rootEntity, {
			amount: this.defaultValue
		})

		// Child entity - top fan model
		this.childEntity = engine.addEntity()
		Transform.create(this.childEntity, { parent: this.rootEntity })
		GltfContainer.create(this.childEntity, {
			src                       : `assets/models/fuelTop${this.MODEL_SUFFIX}.gltf`,
			visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
		})
		FuelPickupChildComponent.create(this.childEntity, {})
	}


	// MARK: getValue
	getValue() : number {
		const component = FuelPickupComponent.getOrNull(this.rootEntity)
		if (!component) return this.defaultValue

		return component.amount
	}


	// MARK: onTriggerPickup
	protected onTriggerPickup(
		triggerEntity: Entity,
	) : void {
		if (triggerEntity === engine.PlayerEntity) {
			this.onHitByPlayer()
			this.Deactivate()
			return
		}

		if (ProjectileComponent.has(triggerEntity)) {
			this.onHitByProjectile(triggerEntity)
			this.Deactivate()
			return
		}
	}


	// MARK: onHitByPlayer
	onHitByPlayer() : void {
		const value = this.getValue()

		console.log("PickupFuel: onHitByPlayer: Player entered")
		ComponentStore.increaseFuelValue(value)
		SoundManager.playSound(sfx.fuelPickup)

		eventBus.emit(ClientEvents.PLAYER_COLLIDED_FUEL, {
			position: this.getPosition(),
			amount  : value
		})
		showFuelToast(value)
	}


	// MARK: onHitByProjectile
	onHitByProjectile(
		entity: Entity,
	) : void {
		const position        = this.getPosition()
		const projectileOwner = ProjectileComponent.getOrNull(entity)?.owner ?? ""

		eventBus.emit(ClientEvents.PROJECTILE_HIT_FUEL, {
			fuelPosition    : position,
			projectileEntity: entity,
			projectileOwner : projectileOwner
		})
		eventBus.emit(ClientEvents.PROJECTILE_HIT_FUEL, {
			position: position
		})

		SoundManager.playSound(sfx.boom, this.rootEntity)
		SoundManager.playSound(sfx.coo, this.rootEntity)

		// Knock back the player, if nearby
		const playerPosition = Transform.getOrNull(engine.PlayerEntity)?.position
		if (playerPosition) {
			const distanceSquared = Vector3.distanceSquared(position, playerPosition)
			if (distanceSquared < EXPLOSION_RADIUS_SQUARED) {
				let ratio = distanceSquared / EXPLOSION_RADIUS_SQUARED
				ratio = Math.min(1, Math.max(0, ratio))
				Physics.applyImpulseToPlayer(Vector3.subtract(playerPosition, position), (1 - ratio) * 200)

				if (projectileOwner === "") {
					ClientMessaging.RequestStatsUpdate(PlayerStatsEnum.KNOCKBACKS_FROM_OWN_EXPLOSIONS)
				} else {
					ClientMessaging.RequestExplosionKnockback(projectileOwner)
				}
			}
		}
	}


	// MARK: createTriggers
	createTriggers() {
		if (this.triggerEntity) return

		// Trigger entity - for player interaction
		this.triggerEntity = engine.addEntity()
		Transform.create(this.triggerEntity, {
			parent: this.rootEntity,
			scale : this.triggerScaleV3
		})
		TriggerArea.setSphere(this.triggerEntity, ColliderLayer.CL_PLAYER | ColliderLayer.CL_CUSTOM1)
		triggerAreaEventsSystem.onTriggerEnter(this.triggerEntity, (e) => {
			const triggerEntity = e.trigger?.entity as Entity | undefined
			if (!triggerEntity) return

			this.TryTriggerPickup(triggerEntity)
		})
	}


	// MARK: destroyTriggers
	destroyTriggers() {
		if (this.triggerEntity) {
			engine.removeEntity(this.triggerEntity)
			this.triggerEntity = undefined
		}
	}


	// MARK: onActivate
	protected onActivate(
		position: Vector3,
	) : void {
		const t = Transform.getMutable(this.rootEntity)
		if (!t) return

		this.defaultPosition = position
		this.animateYOffset = false

		const startPosition = Vector3.create(position.x, 200, position.z)
		t.position          = startPosition
		t.scale             = this.meshScaleV3
		const randomDelay = Math.random() * this.animateDurationActivate + this.animateDurationActivate
		Tween.setMove(this.rootEntity, startPosition, position, randomDelay, EasingFunction.EF_EASEOUTBACK)
		utils.timers.setTimeout(() => {
			this.animateYOffset = true
		}, randomDelay)

		// random value between 10 and 30
		const value     = Math.ceil(Math.random() * 5) * 5 + 5
		const component = FuelPickupComponent.getMutableOrNull(this.rootEntity)
		if (!component) return

		component.amount = value

		this.createTriggers()
	}


	// MARK: onDeactivate
	protected onDeactivate(silent: boolean) : void {
		Tween.setScale(this.rootEntity, this.meshScaleV3, Vector3.Zero(), 200, EasingFunction.EF_EASEBOUNCE)

		this.destroyTriggers()
	}


	// MARK: onStep
	protected onStep(
		dt: number,
	) : void {
		this.animationTimeElapsed += dt
		//console.log("PickupFuel: onStep: dt =", dt)
		const t = Transform.getMutableOrNull(this.childEntity)
		if (!t) return

		const currentRotation = Quaternion.toEulerAngles(t.rotation)
		t.rotation = Quaternion.fromEulerDegrees(
			currentRotation.x,
			currentRotation.y + dt * this.spinSpeed,
			currentRotation.z
		)

		if (this.animateYOffset) {
			const tRoot = Transform.getMutableOrNull(this.rootEntity)
			if (!tRoot) return
			const yOffset = Math.sin(this.animationTimeElapsed * 1) * 0.5
			tRoot.position = Vector3.create(this.defaultPosition.x, this.defaultPosition.y + yOffset, this.defaultPosition.z)
		}
	}
}
