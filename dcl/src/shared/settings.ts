import { Quaternion, Vector3 } from '@dcl/sdk/math'

declare var process: {
    env: {
        NODE_ENV: string
    }
}

const env = process.env.NODE_ENV
export const IS_DEV = env == "development"

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
	GAME_NAME           : "SkyChaser",
	
	LOADING_SCREEN_DELAY: 1000 * 2,

	COUNTDOWN_DURATION  : IS_DEV ? 1000 * 1 : 1000 * 5,
	GAME_DURATION       : IS_DEV ? 1000 * 30 : 1000 * 90, 
	END_GAME_DURATION   : IS_DEV ? 1000 * 3 : 1000 * 10,

	COMBO_COOLDOWN_TIME : 1000 * 10,
	COMBO_MAX_VALUE     : 12,
	
	FUEL_DRAIN_RATE     : 15, // units per second
	FUEL_REFUEL_RATE    : 1, // units per second

	PROJECTILE_SPEED    : 30, // units per second
	PROJECTILE_COOLDOWN : 1000 * 1,
	PROJECTILE_LIFETIME : 3 // seconds, not ms,
} as const

export const ServerSettings = {
	SERVER_TIME_UPDATE_INTERVAL: 1000 * 10,
}
