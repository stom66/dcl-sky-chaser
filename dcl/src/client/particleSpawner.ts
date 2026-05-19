import { engine, Entity, InputAction, inputSystem, ParticleSystem, PBParticleSystem_BlendMode, Transform } from "@dcl/sdk/ecs";
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { ComponentStore } from "src/shared/components/componentStore";


export namespace ParticleSpawner {

	var entity: Entity | null = null

	var isEnabled = false

	export function init() {
		entity = engine.addEntity()
		Transform.create(entity, { 
			parent: engine.PlayerEntity,
			position: Vector3.create(0,1,-0.1),
			rotation: Quaternion.fromEulerDegrees(30, 180, 0)
		})	
		engine.addSystem(systemInputWatcher)
	}

	function createParticleSystem() {
		if (!entity) return

		console.log("ParticleSpawner: creating particle system")

		ParticleSystem.create(entity, {
			active              : true,
			loop                : true,
			prewarm             : false,
			faceTravelDirection : false,
			rate                : 200,
			lifetime            : 2,
			maxParticles        : 400,
			gravity             : 0,
			blendMode           : PBParticleSystem_BlendMode.PSB_ADD,
			shape               : ParticleSystem.Shape.Cone({ 
				angle : 15, 
				radius: 0.05 
			}),
			initialVelocitySpeed: { 
				start: 3, 
				end  : 6 
			},
			initialSize: { 
				start: 0.08, 
				end  : 0.18 
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

	function setActive(active: boolean) {
		if (!entity) return

		if (active) {
			if (!entity) return
			createParticleSystem()
		} else {
			const p = ParticleSystem.getOrNull(entity)
			if (!p) return
			console.log("ParticleSpawner: deleting particle system")
			ParticleSystem.deleteFrom(entity)
		}
	}

	function systemInputWatcher(dt: number) {
		const isEPressed = inputSystem.isPressed(InputAction.IA_PRIMARY)

		if (isEPressed && !isEnabled) {
			isEnabled = true
			console.log("ParticleSpawner: setting active to true")
			setActive(true)
		} else if (!isEPressed && isEnabled) {
			isEnabled = false
			console.log("ParticleSpawner: setting active to false")
			setActive(false)
		}
		
		if (isEPressed && isEnabled) {
			const fuelLevel = ComponentStore.getFuelValue().value
			if (fuelLevel <= 0) {
				setActive(false)
			}
		}
	}
}