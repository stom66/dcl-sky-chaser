import { Vector3 } from "@dcl/sdk/math"

export const CONFIG = {
	DEBUG_LOGGING: false,

	// Model settings
	CREATOR_HUB_MODEL_TAG            : "spectatorMode", // Creator Hub tag that toggles spectate mode
	MAX_INTERACTION_DISTANCE         : 8,                // Maximum distance the player can be from the model to interact with it
	INTERACTION_HOVER_TEXT           : "Use the Pigeon-Peeker 3000",       // Hover text shown on the tagged model

	// Camera settings — 32x32 parcels (base 0,0; parcels 0..31 x, -1..30 z)
	CAMERA_PIVOT_POINT               : Vector3.create(256, 80, 256),
	CAMERA_BOUNDS_MARGIN             : 0.5,
	CAMERA_SCENE_BOUNDS_MIN          : Vector3.create(0, 0, 0),
	CAMERA_SCENE_BOUNDS_MAX          : Vector3.create(512, 200, 512),

	CAMERA_PITCH_SPEED_DEG_PER_SECOND: 60,
	CAMERA_PITCH_DEFAULT             : 45,
	CAMERA_PITCH_MIN                 : -60,
	CAMERA_PITCH_MAX                 : 60,

	CAMERA_YAW_DEFAULT               : 0,
	CAMERA_YAW_SPEED_DEG_PER_SECOND  : 90,

	CAMERA_RAISE_SPEED               : 10,
	CAMERA_MAX_RAISE_OFFSET          : 40,

	CAMERA_LOWER_SPEED               : 10,
	CAMERA_MAX_LOWER_OFFSET          : 14,
	CAMERA_MAX_PLAYER_DISTANCE       : 32,
	CAMERA_MIN_PLAYER_DISTANCE       : 1,

	CAMERA_ZOOM_SPEED_PER_SECOND     : 0.5,
}
