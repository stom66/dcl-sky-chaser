import { Animator, engine, GltfContainer, InputAction, MeshCollider, pointerEventsSystem, PointerEventType, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { Button } from "@dcl/sdk/react-ecs"

export namespace BirdSpawner {

	const transforms = [
		// Pidgeon_02
		{
			position: Vector3.create(243.596, 65.827, 273.368),
			rotation: Quaternion.fromEulerDegrees(0.0, 141.412, 0),
		},
		// Pidgeon_01
		{
			position: Vector3.create(243.411, 73.71, 264.797),
			rotation: Quaternion.fromEulerDegrees(0, 43.343, 0),
		},
		// Pidgeon_01.001
		{
			position: Vector3.create(266.116, 59.488, 275.344),
			rotation: Quaternion.fromEulerDegrees(0, 69.447, 0),
		},
		// Pidgeon_03
		{
			position: Vector3.create(279.033, 61.761, 255.302),
			rotation: Quaternion.fromEulerDegrees(0, 45.0, 0),
		},
		// Pidgeon_02.001
		{
			position: Vector3.create(279.034, 61.761, 256.96),
			rotation: Quaternion.fromEulerDegrees(0, 105.761, 0),
		},
		// Pidgeon_01.002
		{
			position: Vector3.create(250.814, 53.293, 280.957),
			rotation: Quaternion.fromEulerDegrees(0, 213.411, 0),
		},
		// Pidgeon_03.001
		{
			position: Vector3.create(268.702, 52.363, 279.37),
			rotation: Quaternion.fromEulerDegrees(0, 163.131, 0),
		},
		// Pidgeon_01.003
		{
			position: Vector3.create(279.078, 44.971, 255.867),
			rotation: Quaternion.fromEulerDegrees(0, 69.797, 0),
		},
		// Pidgeon_03.002
		{
			position: Vector3.create(265.183, 54.073, 247.209),
			rotation: Quaternion.fromEulerDegrees(0, 334.694, 0),
		},
	]


	export function init() {
		console.log("BirdSpawner: init")

		for (const [index, transform] of transforms.entries()) {

			const bird = engine.addEntity()
			Transform.create(bird, {
				position: transform.position,
				rotation: transform.rotation,
			})

			const num = (index % 3) + 1
			const clip = num === 1 ? "Pigeon1" : num === 2 ? "Pigeon1.001" : "Pigeon1.002"
			const src = `assets/models/bird0${num}.gltf`
			GltfContainer.create(bird, {
				src: src,
			})

			Animator.create(bird, {
				states: [
					{
						clip: clip,
						playing: true,
						loop: true,
					}
				]
			})
			Animator.playSingleAnimation(bird, clip)

			MeshCollider.setSphere(bird)

			pointerEventsSystem.onPointerDown({
				entity: bird,
				opts: { 
					button     : InputAction.IA_POINTER, 
					hoverText  : "Cooo!", 
					maxDistance: 5 
				}
			}, () => {
				console.log("Bird clicked")
				// TODO: do something fun
			})

			console.log("BirdSpawner: spawning bird", index, src)

		}
	}
}