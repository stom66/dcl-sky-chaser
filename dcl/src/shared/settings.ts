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

	COUNTDOWN_DURATION         : 1000 * 5,
	GAME_DURATION              : 1000 * 90, 
	END_GAME_DURATION          : 1000 * 3,

	COMBO_COOLDOWN_TIME        : 1000 * 10,
	COMBO_MAX_VALUE            : 12,
	
	FUEL_DRAIN_RATE            : 15, // units per second
	FUEL_REFUEL_RATE            : 1, // units per second

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
export const FORCE_DEBUG = true