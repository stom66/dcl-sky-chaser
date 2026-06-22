import { Billboard, BillboardMode, engine, Entity, Material, MaterialTransparencyMode, MeshRenderer, PlayerIdentityData, Transform } from "@dcl/sdk/ecs"
import { Color4, Vector3 } from "@dcl/sdk/math"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export namespace BeaconManager {
	let beacons: Entity[] = []
	let elapsed = 0

	export function init() {
		console.log("BeaconManager: init")

		eventBus.on(ClientEvents.GAME_ACTIVE, (data) => {
			createBeacons()
			elapsed = 0
			engine.addSystem(systemPulseBeacons)
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			destroyBeacons()
			engine.removeSystem(systemPulseBeacons)
		})
	}

	function systemPulseBeacons(dt: number) {
		elapsed += dt
		let intensity = Math.sin(elapsed * 5) + 1 * 0.5 + 0.5
		for (const beacon of beacons) {
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
				parent: entity,
				scale: Vector3.create(1, 1024, 1),
			})
			Billboard.create(beacon, {
				billboardMode: BillboardMode.BM_Y,
			})
			MeshRenderer.setPlane(beacon)
			setBeaconMaterial(beacon, 0)
			beacons.push(beacon)
		}
	}

	function destroyBeacons() {
		for (const beacon of beacons) {
			engine.removeEntity(beacon)
		}
		beacons.length = 0
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
