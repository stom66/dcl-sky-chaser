import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"
import { ClientMessaging } from "./clientMessaging"
import { engine, Entity, InputAction, inputSystem, Material, MeshRenderer, Transform } from "@dcl/sdk/ecs"
import { Projectile } from "./gameComponents/projectile"
import { GameSettings } from "src/shared/settings"
import { getUserData } from "~system/UserIdentity"
import { userProfileCache } from "src/shared/utils/userProfileCache"
import { sfx, SoundManager } from "./soundManager"

export namespace ProjectileManager {
	const ProjectilePool: Projectile[] = []
	const ProjectileEntityMap: Map<Entity, Projectile> = new Map()

	var isFPressed      : Boolean      = false
	var gameIsActive    : Boolean      = true
	var timeOfLastFire  : number       = 0

	const HIDE_LOCATION = Vector3.create(128, -100, 128)

	export function init() {
		eventBus.on(ClientEvents.NOTIFY_PROJECTILE_FIRED, (data) => { 
			fireProjectile(data.position, data.direction, data.owner) 
		})
		eventBus.on(ClientEvents.PROJECTILE_FIRED, (data) => { 
			fireProjectile(data.position, data.direction, data.owner) 
		})

		eventBus.on(ClientEvents.PROJECTILE_HIT_FUEL, (data) => { 
			SoundManager.playSound(sfx.coo, data.projectileEntity)
			disableProjectile(data.projectileEntity)
		})
		eventBus.on(ClientEvents.PROJECTILE_HIT_BALLOON, (data) => { 
			SoundManager.playSound(sfx.coo, data.projectileEntity)
			disableProjectile(data.projectileEntity)
		})

/* 		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			gameIsActive = true
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			gameIsActive = false
		}) */

		engine.addSystem(sys_UpdateProjectiles)
		engine.addSystem(sys_InputWatcher)
	}

	// Triggered when local or server players request a projectile
	function requestProjectile(data: { position: Vector3, direction: Vector3, owner?: string }) {
		console.log('ProjectileManager: requestProjectile: data', data)
		ClientMessaging.RequestProjectile(data.position, data.direction)
		eventBus.emit(ClientEvents.PROJECTILE_FIRED, data) // indirectly call the spawnProjectile function below
	}

	// Get a pooled projectile, or create a new one if none are available
	function fireProjectile(
		origin   : Vector3, 
		direction: Vector3,
		owner    : string = ""
	) : void {
		let projectile = getIdleProjectile()
		if (projectile === null) {
			projectile = new Projectile(HIDE_LOCATION)
			ProjectilePool.push(projectile)
			ProjectileEntityMap.set(projectile.entity, projectile)
		}

		projectile.Fire(origin, direction, owner)

	}

	function getIdleProjectile() : Projectile | null {
		for (const projectile of ProjectilePool) {
			if (!projectile.isActive()) {
				return projectile
			}
		}
		return null
	}

	function disableProjectile(
		entity: Entity
	) : void {
		const projectile = ProjectileEntityMap.get(entity)
		if (projectile) {
			projectile.Disable()
		}
	}

	function sys_UpdateProjectiles(dt: number) : void {
		for (const projectile of ProjectilePool) {
			if (projectile.isActive()) {
				projectile.MoveForward(dt)
			}
		}
	}

	function sys_InputWatcher(dt: number) {
		isFPressed     = inputSystem.isPressed(InputAction.IA_SECONDARY)

		if (isFPressed && gameIsActive) {
			const timeSinceLastFire = Date.now() - timeOfLastFire
			if (timeSinceLastFire > GameSettings.PROJECTILE_COOLDOWN) {
				const position = Transform.getOrNull(engine.PlayerEntity)?.position
				const cameraRotation = Transform.getOrNull(engine.CameraEntity)?.rotation

				if (!position || !cameraRotation) return

				const origin = Vector3.add(position, Vector3.create(0, 1.4, 0))
				const direction = Vector3.rotate(Vector3.Forward(), cameraRotation)
				timeOfLastFire = Date.now()
				requestProjectile({position: origin, direction})
			}
		}
	}
}