import { Billboard, BillboardMode, engine, Entity, Material, MaterialTransparencyMode, MeshRenderer, PlayerIdentityData, Transform } from "@dcl/sdk/ecs"
import { Color4, Vector3 } from "@dcl/sdk/math"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export namespace BeaconManager {
	let beacons: Entity[] = []
	let elapsed = 0

	let beaconMap: Map<Entity, Entity> = new Map() // Maps PlayerEntity <-> BeaconEntity

	export function init() {
		console.log("BeaconManager: init")

		eventBus.on(ClientEvents.GAME_ACTIVE, (data) => {
			createBeacons()
			elapsed = 0
			engine.addSystem(sys_updateBeacons)
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			engine.removeSystem(sys_updateBeacons)

			destroyBeacons()
		})
	}

	function sys_updateBeacons(dt: number) {
		elapsed += dt

		let offset = 0
		for (const [player, beacon] of beaconMap) {
			offset += 0.2
			let intensity = Math.sin(elapsed * 5) + 1 * 0.5 + 0.5 + offset

			const bT = Transform.getMutableOrNull(beacon)
			const pT = Transform.getOrNull(player)
			if (!bT || !pT) continue

			bT.position = pT.position

			setBeaconMaterial(beacon, intensity)
		}
	}

	function createBeacons() {
		destroyBeacons()

		// Loop through all players and create a beacon for each player
		for (const [entity, data, transform] of engine.getEntitiesWith(
			PlayerIdentityData,
			Transform
		)) {
			// Ignore ourselves
			if (entity === engine.PlayerEntity) continue // DEBUG: comment this out to force a beacon on yourself


			const beacon = engine.addEntity()
			Transform.create(beacon, {
				scale: Vector3.create(1.5, 1024, 1.5),
			})
			Billboard.create(beacon, {
				billboardMode: BillboardMode.BM_Y,
			})
			MeshRenderer.setPlane(beacon)
			setBeaconMaterial(beacon, 0)
			beaconMap.set(entity, beacon)
		}
	}

	function destroyBeacons() {
		for (const [player, beacon] of beaconMap) {
			engine.removeEntity(beacon)
			beaconMap.delete(player)
		}
		beaconMap.clear()
	}

	function setBeaconMaterial(
		beacon   : Entity, 
		intensity: number
	) {		
		Material.setPbrMaterial(beacon, {
			albedoColor      : Color4.White(),
			metallic         : 0,
			roughness        : 1,
			texture          : Material.Texture.Common({ src: 'assets/tex/beacon-gradient.png' }),
			alphaTexture     : Material.Texture.Common({ src: 'assets/tex/beacon-gradient.png' }),
			emissiveColor    : Color4.Yellow(),
			emissiveIntensity: intensity,
			transparencyMode : MaterialTransparencyMode.MTM_ALPHA_BLEND
		})
	}
}
