import { engine, Entity, InputAction, Material, MaterialTransparencyMode, MeshRenderer, pointerEventsSystem, Transform } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { changeRealm } from "~system/RestrictedActions"

import { C_MostWanted, ComponentStore } from "src/shared/components/componentStore"
import { MostWantedState } from "src/shared/components/mostWanted"


export namespace NoticeBoard {

	// MARK: Types
	type Poster = {
		tag        : string,
		name       : string,
		destination: string,
		hoverText  : string,
	}


	// MARK: Vars
	const POSITION_WANTED_PIGEONS = Vector3.create(266.824, 65.5243, 265.823)
	const POSITION_WANTED_MURDER  = Vector3.create(268.145, 65.239,  264.89)
	const PORTRAIT_SCALE          = Vector3.create(0.84, 0.84, 0.84)
	const PORTRAIT_ROTATION       = Quaternion.fromEulerDegrees(0, 215.23, 0)

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

	let pigeonsPlane: Entity | undefined
	let murderPlane : Entity | undefined

	let lastPigeonsUserId: string = ""
	let lastMurderUserId : string = ""


	// MARK: Init
	/**
	 * Wires poster teleports and MostWanted avatar portrait planes.
	 */
	export function init() {
		initPosters()
		initPortraits()
	}


	// MARK: initPosters
	function initPosters(): void {
		for (const poster of posters) {
			const entities = engine.getEntitiesByTag(poster.tag)
			const entity   = [...entities][0]

			if (!entity) {
				console.error(`NoticeBoard: initPosters: Poster ${poster.tag} not found`)
				continue
			}

			pointerEventsSystem.onPointerDown(
				{
					entity: entity,
					opts  : {
						button     : InputAction.IA_POINTER,
						hoverText  : poster.hoverText,
						maxDistance: 5,
					}
				},
				() => {
					changeRealm({
						realm  : poster.destination,
						message: "Teleporting to " + poster.name,
					})
				}
			)
		}
	}


	// MARK: initPortraits
	function initPortraits(): void {
		pigeonsPlane = createPortraitPlane(POSITION_WANTED_PIGEONS, ComponentStore.getMostWanted().wantedForPigeons)
		murderPlane  = createPortraitPlane(POSITION_WANTED_MURDER,  ComponentStore.getMostWanted().wantedForMurder)

		updatePortraits(ComponentStore.getMostWanted())

		ComponentStore.onComponentChange(C_MostWanted.MostWanted, (data) => {
			updatePortraits({
				wantedForPigeons: data?.wantedForPigeons ?? "",
				wantedForMurder : data?.wantedForMurder  ?? "",
			})
		})
	}


	// MARK: createPortraitPlane
	function createPortraitPlane(
		position: Vector3, 
		userId  : string
	): Entity {
		const entity = engine.addEntity()

		Transform.create(entity, {
			position: position,
			scale   : PORTRAIT_SCALE,
			rotation: PORTRAIT_ROTATION,
		})
		MeshRenderer.setPlane(entity)

		applyPortraitMaterial(entity, userId)

		return entity
	}


	// MARK: updatePortraits
	function updatePortraits(state: MostWantedState): void {
		if (pigeonsPlane !== undefined && state.wantedForPigeons !== lastPigeonsUserId) {
			lastPigeonsUserId = state.wantedForPigeons
			applyPortraitMaterial(pigeonsPlane, state.wantedForPigeons)
		}

		if (murderPlane !== undefined && state.wantedForMurder !== lastMurderUserId) {
			lastMurderUserId = state.wantedForMurder
			applyPortraitMaterial(murderPlane, state.wantedForMurder)
		}
	}


	// MARK: applyPortraitMaterial
	function applyPortraitMaterial(
		entity: Entity,
		userId: string
	): void {
		if (!userId) {
			Material.setPbrMaterial(entity, {
				albedoColor     : Color4.create(1, 1, 1, 0),
				transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
			})
			return
		}

		Material.setPbrMaterial(entity, {
			texture         : Material.Texture.Avatar({ userId }),
			transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
		})
	}
}
