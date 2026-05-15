import { Quaternion, Vector3 } from '@dcl/sdk/math'


export const SceneSettings = {
	SCENE_TRANSFORM: {
		position: Vector3.create(0, 0, 0),
		rotation: Quaternion.fromEulerDegrees(0, 0, 0),
		scale:    Vector3.create(1, 1, 1),
	},

	SCENE_TRANSFORM_180: {
		position: Vector3.create(0, 0, 0),
		rotation: Quaternion.fromEulerDegrees(0, 180, 0),
		scale:    Vector3.create(1, 1, 1),
	},
} as const


export const GameSettings = {
	LOADING_SCREEN_DELAY       : 1000 * 2,
	FUEL_DRAIN_RATE            : 15, // units per second

} as const

export const ServerSettings = {
	SERVER_TIME_UPDATE_INTERVAL: 1000 * 10,
}

declare var process: {
    env: {
        NODE_ENV: string
    }
}

const env = process.env.NODE_ENV
export const IS_DEV = env == "development"