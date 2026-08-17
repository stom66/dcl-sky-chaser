import { Billboard, BillboardMode, engine, Entity, Material, MaterialTransparencyMode, MeshRenderer, PlayerIdentityData, Transform } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { getPlayer } from "@dcl/sdk/players"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export namespace BeaconManager {
	let elapsed = 0

	const arrowSpeed = 20

	const beaconScale = Vector3.create(1.5, 92, 1.5)
	const arrowScale  = Vector3.create(2.2, 2.2, 2.2)
	const halfHeight  = beaconScale.y / 2

	// Absolute Y thresholds from the parent center.
	// Arrows travel toward center, scale up until scaleDownHeight, then scale down to 0 at resetHeight.
	const arrowResetHeight     = 2
	const arrowScaleDownHeight = 8

	let beaconMap      : Map<Entity, Entity> = new Map() // Maps PlayerEntity <-> RootEntity
	const beaconMeshMap: Map<Entity, Entity> = new Map() // Maps RootEntity <-> BeaconMesh
	const arrowUpPool  : Entity[]            = []
	const arrowDownPool: Entity[]            = []

	// MARK: Init
	/**
	 * Registers game start/end handlers for beacons and arrows.
	 */
	export function init() {
		console.log("BeaconManager: init")

		eventBus.on(ClientEvents.GAME_ACTIVE, (data) => {
			createBeacons()
			elapsed = 0
			engine.addSystem(sys_updateBeacons)
			engine.addSystem(sys_updateArrows)
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			engine.removeSystem(sys_updateBeacons)
			engine.removeSystem(sys_updateArrows)

			destroyBeacons()
		})
	}


	// MARK: SYS: Update Beacons
	function sys_updateBeacons(dt: number) {
		elapsed += dt

		let offset = 0
		for (const [player, root] of Array.from(beaconMap)) {
			offset += 0.2
			let intensity = Math.sin(elapsed * 5) + 1 * 0.5 + 0.5 + offset

			const rT       = Transform.getMutableOrNull(root)
			const pT       = Transform.getOrNull(player)
			const identity = PlayerIdentityData.getOrNull(player)
			if (!rT || !pT || !identity) {
				destroyBeacon(player)
				continue
			}

			rT.position = pT.position

			const beacon = beaconMeshMap.get(root)
			if (beacon) setBeaconMaterial(beacon, intensity)
		}
	}


	// MARK: SYS: Update Arrows
	function sys_updateArrows(dt: number) {
		const step = dt * arrowSpeed

		for (const arrowUp of arrowUpPool) {
			updateArrow(arrowUp, step)
		}
		for (const arrowDown of arrowDownPool) {
			updateArrow(arrowDown, -step)
		}
	}


	// MARK: updateArrow
	/**
	 * Moves an arrow along Y by `step`, respawns past reset height, and applies two-phase scale.
	 * Positive step = traveling up (spawned below). Negative step = traveling down (spawned above).
	 */
	function updateArrow(
		arrow: Entity,
		step : number
	) {
		const t = Transform.getMutableOrNull(arrow)
		if (!t) return

		t.position = Vector3.add(t.position, Vector3.create(0, step, 0))

		const absY = Math.abs(t.position.y)
		if (absY < arrowResetHeight) {
			// Respawn at the far end of the travel direction
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


	// MARK: Create Beacons
	function createBeacons() {
		destroyBeacons()

		const localUserId = getPlayer()?.userId?.toLowerCase()

		// Loop through all players and create a beacon for each player
		for (const [entity, data, transform] of engine.getEntitiesWith(
			PlayerIdentityData,
			Transform
		)) {
			// Ignore ourselves (PlayerEntity and any duplicate identity entity for the local address)
			if (entity === engine.PlayerEntity) continue // DEBUG: comment this out to force a beacon on yourself

			const address = data.address?.toLowerCase()
			if (!address || address === localUserId) continue

			// DCL can expose more than one entity per address; only track the canonical one.
			// The extras are often frozen at the scene spawn and look like orphan beacons.
			const canonical = getPlayer({ userId: address })?.entity
			if (!canonical || entity !== canonical) continue

			// Unscaled root so arrow local offsets are true meters, not scaled by the tall beacon
			const root = engine.addEntity()
			beaconMap.set(entity, root)

			Transform.create(root, {
				position: transform.position,
			})
			Billboard.create(root, {
				billboardMode: BillboardMode.BM_Y,
			})

			const beacon = engine.addEntity()
			beaconMeshMap.set(root, beacon)
			Transform.create(beacon, {
				parent: root,
				scale : beaconScale,
			})
			MeshRenderer.setPlane(beacon)
			setBeaconMaterial(beacon, 0)

			createArrows(root)
		}
	}


	// MARK: Create Arrows
	function createArrows(parent: Entity) {
		//createArrow(parent, -beaconScale.y / 6)
		createArrow(parent, -halfHeight / 4)
		createArrow(parent, -halfHeight)

		//createArrow(parent, beaconScale.y / 6)
		createArrow(parent, halfHeight / 4)
		createArrow(parent, halfHeight)
	}


	// MARK: createArrow
	function createArrow(
		parent : Entity,
		yOffset: number
	) {
		const arrow = engine.addEntity()
		Transform.create(arrow, {
			parent  : parent,
			scale   : arrowScale,
			position: Vector3.create(0, yOffset, 0),
			rotation: Quaternion.fromEulerDegrees(0, 0, (yOffset < 0 ? 180 : 0))
		})

		MeshRenderer.setPlane(arrow)
		setArrowMaterial(arrow, 0, yOffset > 0)

		if (yOffset > 0) arrowDownPool.push(arrow)
		if (yOffset < 0) arrowUpPool.push(arrow)

		return arrow
	}


	// MARK: destroyBeacon
	/**
	 * Removes one player's beacon (root, mesh, and parented arrows).
	 */
	function destroyBeacon(player: Entity) {
		const root = beaconMap.get(player)
		if (!root) return

		for (const pool of [arrowUpPool, arrowDownPool]) {
			for (let i = pool.length - 1; i >= 0; i--) {
				const t = Transform.getOrNull(pool[i])
				if (t?.parent !== root) continue
				engine.removeEntity(pool[i])
				pool.splice(i, 1)
			}
		}

		const beacon = beaconMeshMap.get(root)
		if (beacon) {
			engine.removeEntity(beacon)
			beaconMeshMap.delete(root)
		}

		engine.removeEntity(root)
		beaconMap.delete(player)
	}


	// MARK: Destroy Beacons
	function destroyBeacons() {
		for (const arrow of arrowDownPool) {
			engine.removeEntity(arrow)
		}
		for (const arrow of arrowUpPool) {
			engine.removeEntity(arrow)
		}
		for (const beacon of beaconMeshMap.values()) {
			engine.removeEntity(beacon)
		}
		for (const root of beaconMap.values()) {
			engine.removeEntity(root)
		}

		arrowDownPool.length = 0
		arrowUpPool.length   = 0
		beaconMeshMap.clear()
		beaconMap.clear()
	}


	// MARK: Set Beacon Material
	function setBeaconMaterial(
		beacon   : Entity,
		intensity: number
	) {
		Material.setPbrMaterial(beacon, {
			albedoColor      : Color4.White(),
			metallic         : 0,
			roughness        : 1,
			texture          : Material.Texture.Common({ src: 'assets/tex/beacon-gradient-round.png' }),
			alphaTexture     : Material.Texture.Common({ src: 'assets/tex/beacon-gradient-round.png' }),
			emissiveColor    : Color4.Yellow(),
			emissiveIntensity: intensity,
			transparencyMode : MaterialTransparencyMode.MTM_ALPHA_BLEND
		})
	}


	// MARK: Set Arrow Material
	/**
	 * Applies the arrow PBR material. `flipped` reserved for UV flip of down arrows.
	 */
	function setArrowMaterial(
		arrow    : Entity,
		intensity: number,
		flipped  : boolean
	) {
		Material.setPbrMaterial(arrow, {
			albedoColor      : Color4.White(),
			metallic         : 0,
			roughness        : 1,
			texture          : Material.Texture.Common({ src: 'assets/tex/beacon-arrows.png' }),
			alphaTexture     : Material.Texture.Common({ src: 'assets/tex/beacon-arrows.png' }),
			emissiveColor    : Color4.Red(),
			emissiveIntensity: intensity,
			transparencyMode : MaterialTransparencyMode.MTM_ALPHA_BLEND
		})
	}
}
