import { AvatarAnchorPointType, AvatarAttach, Billboard, BillboardMode, engine, Entity, Material, MaterialTransparencyMode, MeshRenderer, PlayerIdentityData, Transform, TransformType } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { getPlayer, onEnterScene, onLeaveScene } from "@dcl/sdk/players"

import { BeaconArrowComponent, BeaconComponent } from "src/shared/components/beacon"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export namespace BeaconManager {
	let isGameActive = false

	const arrowSpeed      = 20
	const beaconSpinSpeed = 90

	const beaconScale = Vector3.create(1.5, 48, 1.5)
	const arrowScale  = Vector3.create(2.2, 2.2, 2.2)
	const halfHeight  = beaconScale.y / 2

	const arrowResetHeight     = 2
	const arrowScaleDownHeight = 8


	// MARK: Init
	/**
	 * Registers game start/end handlers for beacons and arrows.
	 */
	export function init() {
		console.log("BeaconManager: init")

		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			isGameActive = true
			createBeacons()
			engine.addSystem(sys_updateBeacons)
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			isGameActive = false
			engine.removeSystem(sys_updateBeacons)
			destroyBeacons()
		})

		onEnterScene((player) => {
			if (!isGameActive || !player?.entity || !player.userId) return
			createBeaconForPlayer(player.entity, player.userId)
		})
		onLeaveScene((userId) => {
			if (userId) destroyBeacons(userId)
		})
	}


	// MARK: SYS: Update Beacons
	function sys_updateBeacons(dt: number) {
		const arrowStep = dt * arrowSpeed

		for (const [entity, transform] of engine.getEntitiesWith(Transform)) {
			const parent = transform.parent
			if (parent === undefined) continue
			if (BeaconArrowComponent.has(entity)) continue

			const grandparent = Transform.getOrNull(parent)?.parent
			if (grandparent === undefined || !BeaconComponent.has(grandparent)) continue

			const t = Transform.getMutableOrNull(entity)
			if (!t) continue

			const euler = Quaternion.toEulerAngles(t.rotation)
			t.rotation  = Quaternion.fromEulerDegrees(euler.x, euler.y + dt * beaconSpinSpeed, euler.z)
		}

		for (const [entity, data] of engine.getEntitiesWith(BeaconArrowComponent)) {
			const t = Transform.getMutableOrNull(entity)
			if (!t) continue
			updateArrow(t, arrowStep * data.direction)
		}
	}


	// MARK: updateArrow
	/**
	 * Moves an arrow along Y by `step`, respawns past reset height, and applies two-phase scale.
	 * Positive step = traveling up (spawned below). Negative step = traveling down (spawned above).
	 */
	function updateArrow(
		t   : TransformType,
		step: number
	) {
		t.position = Vector3.add(t.position, Vector3.create(0, step, 0))

		const absY = Math.abs(t.position.y)
		if (absY < arrowResetHeight) {
			t.position.y = step > 0 ? -halfHeight : halfHeight
		}

		t.scale = Vector3.scale(arrowScale, getArrowScaleFactor(Math.abs(t.position.y)))
	}


	// MARK: getArrowScaleFactor
	/**
	 * Returns 0..1 scale factor from absolute distance to parent center.
	 * Far → scaleDownHeight: ramp up. scaleDownHeight → resetHeight: ramp down.
	 */
	function getArrowScaleFactor(absY: number): number {
		if (absY >= arrowScaleDownHeight) {
			const span = halfHeight - arrowScaleDownHeight
			if (span <= 0) return 1
			return clamp01((halfHeight - absY) / span)
		}

		const span = arrowScaleDownHeight - arrowResetHeight
		if (span <= 0) return 0
		return clamp01((absY - arrowResetHeight) / span)
	}


	// MARK: clamp01
	function clamp01(value: number): number {
		if (value < 0) return 0
		if (value > 1) return 1
		return value
	}


	// MARK: hasBeacon
	function hasBeacon(addressKey: string): boolean {
		for (const [, data] of engine.getEntitiesWith(BeaconComponent)) {
			if (data.userId === addressKey) return true
		}
		return false
	}


	// MARK: Create Beacons
	function createBeacons() {
		destroyBeacons()

		const localUserId = getPlayer()?.userId?.toLowerCase()

		for (const [entity, data] of engine.getEntitiesWith(
			PlayerIdentityData,
			Transform
		)) {
			if (entity === engine.PlayerEntity) continue

			const address = data.address
			if (!address) continue
			const addressKey = address.toLowerCase()
			if (addressKey === localUserId) continue

			const canonical = getPlayer({ userId: addressKey })?.entity
			if (!canonical || entity !== canonical) continue

			createBeaconForPlayer(entity, address)
		}
	}


	// MARK: createBeaconForPlayer
	/**
	 * Attaches one beacon to a remote player via AvatarAttach.
	 * BeaconComponent lives only on the root. Arrows use BeaconArrowComponent.
	 */
	function createBeaconForPlayer(
		entity : Entity,
		address: string
	) {
		if (entity === engine.PlayerEntity) return

		const addressKey = address.toLowerCase()
		if (!addressKey) return
		if (addressKey === getPlayer()?.userId?.toLowerCase()) return
		if (hasBeacon(addressKey)) return

		const beacon = engine.addEntity()
		Transform.create(beacon)
		AvatarAttach.create(beacon, {
			avatarId     : address,
			anchorPointId: AvatarAnchorPointType.AAPT_POSITION,
		})
		BeaconComponent.create(beacon, {
			userId: addressKey,
		})

		const billboardRoot = engine.addEntity()
		Transform.create(billboardRoot, { parent: beacon })
		Billboard.create(billboardRoot, { billboardMode: BillboardMode.BM_Y })

		createBeaconMesh(billboardRoot, 0)
		createBeaconMesh(billboardRoot, 90)

		createArrow(billboardRoot, addressKey, -halfHeight / 4)
		createArrow(billboardRoot, addressKey, -halfHeight)
		createArrow(billboardRoot, addressKey,  halfHeight / 4)
		createArrow(billboardRoot, addressKey,  halfHeight)
	}


	// MARK: createBeaconMesh
	function createBeaconMesh(
		parent   : Entity,
		yawOffset: number
	) {
		const mesh = engine.addEntity()
		Transform.create(mesh, {
			parent  : parent,
			scale   : beaconScale,
			rotation: Quaternion.fromEulerDegrees(0, yawOffset, 0),
		})
		MeshRenderer.setPlane(mesh)
		setBeaconMaterial(mesh)
	}


	// MARK: createArrow
	function createArrow(
		parent : Entity,
		userId : string,
		yOffset: number
	) {
		const arrow = engine.addEntity()
		Transform.create(arrow, {
			parent  : parent,
			scale   : arrowScale,
			position: Vector3.create(0, yOffset, 0),
			rotation: Quaternion.fromEulerDegrees(0, 0, (yOffset < 0 ? 180 : 0)),
		})
		MeshRenderer.setPlane(arrow)
		setArrowMaterial(arrow)
		
		BeaconArrowComponent.create(arrow, {
			userId   : userId,
			direction: yOffset < 0 ? 1 : -1,
		})
	}


	// MARK: Destroy Beacons
	function destroyBeacons(userId?: string) {
		const userIdKey = userId?.toLowerCase()

		for (const [entity, data] of engine.getEntitiesWith(BeaconComponent)) {
			if (userIdKey && data.userId !== userIdKey) continue
			engine.removeEntity(entity)
		}
		for (const [entity, data] of engine.getEntitiesWith(BeaconArrowComponent)) {
			if (userIdKey && data.userId !== userIdKey) continue
			engine.removeEntity(entity)
		}
	}


	// MARK: Set Beacon Material
	function setBeaconMaterial(beacon: Entity) {
		Material.setPbrMaterial(beacon, {
			albedoColor      : Color4.White(),
			metallic         : 0,
			roughness        : 1,
			texture          : Material.Texture.Common({ src: 'assets/tex/beacon-gradient-round.png' }),
			alphaTexture     : Material.Texture.Common({ src: 'assets/tex/beacon-gradient-round.png' }),
			emissiveColor    : Color4.Yellow(),
			transparencyMode : MaterialTransparencyMode.MTM_ALPHA_BLEND,
		})
	}


	// MARK: Set Arrow Material
	function setArrowMaterial(arrow: Entity) {
		Material.setPbrMaterial(arrow, {
			albedoColor      : Color4.White(),
			metallic         : 0,
			roughness        : 1,
			texture          : Material.Texture.Common({ src: 'assets/tex/beacon-arrows.png' }),
			alphaTexture     : Material.Texture.Common({ src: 'assets/tex/beacon-arrows.png' }),
			emissiveColor    : Color4.Red(),
			emissiveIntensity: 0,
			transparencyMode : MaterialTransparencyMode.MTM_ALPHA_BLEND,
		})
	}
}
