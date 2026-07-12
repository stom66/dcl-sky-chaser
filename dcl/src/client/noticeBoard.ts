import { engine, Entity, InputAction, PointerEvents, pointerEventsSystem, PointerEventType, Transform } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import { changeRealm, teleportTo } from "~system/RestrictedActions"

export namespace NoticeBoard {

	// MARK: Types
	type Poster = {
		tag        : string,
		name       : string,
		destination: string,
		hoverText  : string,
	}

	// MARK: Vars
	const posters: Poster[] = [
		{
			tag        : "PosterFlagTag",
			name       : "FlagTag",
			destination: "flagtag.dcl.eth",
			hoverText  : "Visit FlagTag!"
		},
		{
			tag        : "PosterPigeonDeluxe",
			name       : "Pigeon Deluxe",
			destination: "pigeondeluxe.dcl.eth",
			hoverText  : "Visit Pigeon Deluxe!"
		},
		
	]


	// MARK: Init
    export function init() {

		for (const poster of posters) {

			const entities = engine.getEntitiesByTag(poster.tag)
			const entity = [...entities][0]

			if (!entity) {
				console.error(`NoticeBoard: Poster ${poster.tag} not found`)
				continue
			}
			
			pointerEventsSystem.onPointerDown(
				{ 
					entity: entity, 
					opts: { 
						button     : InputAction.IA_POINTER,
						hoverText  : poster.hoverText,
						maxDistance: 5,
					}
				}, 
				() => { 
					changeRealm({
						realm: poster.destination,
						message: "Teleporting to " + poster.name,
					})
				}
			)
		}
    }
}