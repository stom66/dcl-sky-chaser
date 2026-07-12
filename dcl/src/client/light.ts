import { engine, LightSource, Transform } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"

export namespace Light {
	export function init() {

		// Leaderboard Light
		const light = engine.addEntity()
		Transform.create(light, {
			position: Vector3.create(252.657, 72.5, 268.874),
			rotation: Quaternion.fromEulerDegrees(20, -90, 0),
			scale   : Vector3.create(1, 1, 1),
		})
		LightSource.create(light, {
			type     : LightSource.Type.Spot({
				innerAngle : 40,
				outerAngle : 50,
			}),
			color      : Color4.White(),
			intensity  : 250000,
			active     : true,
			shadow     : true,
		})

		// snug  Light
		const noticeBaord = engine.addEntity()
		Transform.create(noticeBaord, {
			position: Vector3.create(264.875, 67.5, 261.953),
			rotation: Quaternion.fromEulerDegrees(25, 32.5, 0),
		})
		LightSource.create(noticeBaord, {
			type     : LightSource.Type.Spot({
				innerAngle : 60,
				outerAngle : 75,
			}),
			color      : Color4.White(),
			intensity  : 45000,
			active     : true,
			shadow     : true,
		})


		// snug  Light
		const snug = engine.addEntity()
		Transform.create(snug, {
			position: Vector3.create(255.753, 58.5, 255.984),
			rotation: Quaternion.fromEulerDegrees(0, 0, 0),
		})
		LightSource.create(snug, {
			type     : LightSource.Type.Point({}),
			color      : Color4.Yellow(),
			intensity  : 50000,
		})
	}
}