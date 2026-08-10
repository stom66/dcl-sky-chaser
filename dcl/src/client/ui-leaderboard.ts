import { Animator, engine, Entity, GltfContainer, InputAction, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, pointerEventsSystem, PointerEventType, TextAlignMode, TextShape, Transform } from "@dcl/sdk/ecs";
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { UiEntity } from "@dcl/sdk/react-ecs";
import { LeaderboardEntry } from "src/shared/classes/leaderboard";
import { C_Leaderboards, ComponentStore } from "src/shared/components/componentStore";
import { sfx, SoundManager } from "./soundManager";

export namespace UILeaderboard {
	const entities: Entity[] = []

	let toggleButton: Entity | null = null

	let currentLeaderboard: string = "Weekly"


	// MARK: Init
	export function init() {

		updateLeaderboard(currentLeaderboard, ComponentStore.getLeaderboardWeekly())

		ComponentStore.onComponentChange(C_Leaderboards.leaderboardWeekly, (data) => {
			if (currentLeaderboard === "Weekly") {
				updateLeaderboard(currentLeaderboard, [...(data?.scores ?? [])])
			}
		})

		ComponentStore.onComponentChange(C_Leaderboards.leaderboardAllTime, (data) => {
			if (currentLeaderboard === "AllTime") {
				updateLeaderboard(currentLeaderboard, [...(data?.scores ?? [])])
			}
		})

		// Spawn the toggle button
		toggleButton = engine.addEntity()
		Transform.create(toggleButton, {
			position: Vector3.create(243.28, 66.75, 265),
			rotation: Quaternion.fromEulerDegrees(0, 180, 0),
			scale   : Vector3.create(1, 1, 1),
		})
		GltfContainer.create(toggleButton, {
			src: "assets/models/toggleLever.gltf",
		})
		Animator.create(toggleButton, {
			states: [
				{
					clip: "LeverDown",
					playing: false,
					loop: false,
				},
				{
					clip: "LeverUp",
					playing: false,
					loop: false,
				}
			]
		})

		pointerEventsSystem.onPointerDown({
			entity: toggleButton,
			opts: {
				button     : InputAction.IA_POINTER,
				hoverText  : "Toggle Leaderboard",
				maxDistance: 12,
			},
		}, () => {
			SoundManager.playSound(sfx.lever)
			toggleLeaderboard()
		})
	}


	// MARK: Toggle Leaderboard
	function toggleLeaderboard() {
		if (currentLeaderboard === "Weekly") {
			currentLeaderboard = "AllTime"
			updateLeaderboard(currentLeaderboard, ComponentStore.getLeaderboardAllTime())
			if (toggleButton) {
				Animator.playSingleAnimation(toggleButton, "LeverDown")
			}
		} else {
			currentLeaderboard = "Weekly"
			updateLeaderboard(currentLeaderboard, ComponentStore.getLeaderboardWeekly())
			if (toggleButton) {
				Animator.playSingleAnimation(toggleButton, "LeverUp")
			}
		}
	}


	// MARK: Update Leaderboard
	function updateLeaderboard(title: string, entries: Omit<LeaderboardEntry, 'lastUpdated'>[]) {
		removeAllEntities()

		const origin = Vector3.create(243.3, 70.2, 269)
		const rotation = Quaternion.fromEulerDegrees(0, -90, 0)

		const rowSpacing = 0.5
		// We're going to build a 2d UI and place it on the baord

		// Title - z+ moves text right, y+ moves up
		const titlePos = Vector3.add(origin, Vector3.create(0, 0, 0))
		addTextShape(title, titlePos, rotation, 7, TextAlignMode.TAM_BOTTOM_CENTER)

		let rowOffset = 0

		if (entries.length === 0) {
			const rowPosition = Vector3.add(origin, Vector3.create(0, -0.8, 0))
			addTextShape("~ No entries ~", rowPosition, rotation, 4, TextAlignMode.TAM_TOP_CENTER)
			return
		}

		// MARK: Row
		for (const [index, entry] of entries.entries()) {
			const rowPosition = Vector3.add(origin, Vector3.create(0, rowOffset, 0))
			// Row offset gets smaller as index increases: first row gets full spacing, last row half.
			const factor = 1 - (index / (entries.length - 1 || 1)) * 0.333
			rowOffset -= rowSpacing * factor

			// Background
			addBackground(rowPosition, index % 2 === 0)

			const fontSize = 3 - (index * 0.15)
			// Rank
			let colPosition = Vector3.add(rowPosition, Vector3.create(0, 0, -2.25))
			addTextShape(entry.rank.toString() ?? "~", colPosition, rotation, fontSize)


			// Avatar
			colPosition = Vector3.add(rowPosition, Vector3.create(0, 0, -1.8))
			addAvatar(entry.userId ?? "", colPosition, rotation)

			// Display Name
			colPosition = Vector3.add(rowPosition, Vector3.create(0, 0, -1.5))
			addTextShape(entry.displayName ?? "Unknown", colPosition, rotation, fontSize)

			// Score
			colPosition = Vector3.add(rowPosition, Vector3.create(0, 0, 2.3))
			addTextShape(entry.score.toString(), colPosition, rotation, fontSize, TextAlignMode.TAM_TOP_RIGHT)
		}
	}

	function addBackground(position: Vector3, flip: boolean) {
		const uiEntity = engine.addEntity()
		entities.push(uiEntity)
		Transform.create(uiEntity, {
			position: Vector3.subtract(position, Vector3.create(0, 0.2, -0.05)),
			rotation: Quaternion.fromEulerDegrees(0, 90, flip ? 180 : 0),
			scale   : Vector3.create(5, 0.4, 1),
		})
		MeshRenderer.setPlane(uiEntity)
		Material.setPbrMaterial(uiEntity, {
			texture         : Material.Texture.Common({ src: "assets/tex/bg-scoreboard.png" }),
			alphaTest       : 0.2,
			transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
			castShadows     : false,
		})
	}

	function addTextShape(
		text    : string, 
		position: Vector3, 
		rotation: Quaternion,
		fontSize: number = 3,
		align   : TextAlignMode = TextAlignMode.TAM_TOP_LEFT
	) {
		const uiEntity = engine.addEntity()
		entities.push(uiEntity)
		Transform.create(uiEntity, {
			position: position,
			rotation: rotation,
			scale   : Vector3.create(1, 1, 1),
		})
		TextShape.create(uiEntity, {
			text         : text,
			fontSize     : fontSize,
			textAlign    : align,
			shadowColor  : Color4.fromHexString('#444444'),
			shadowBlur   : 0.5,
			shadowOffsetX: 1,
			shadowOffsetY: -1,
		})
	}

	function addAvatar(userId: string, position: Vector3, rotation: Quaternion) {
		const uiEntity = engine.addEntity()
		entities.push(uiEntity)
		Transform.create(uiEntity, {
			position: Vector3.subtract(position, Vector3.create(0, 0.2, 0)),
			rotation: rotation,
			scale   : Vector3.create(0.4, 0.4, 0.4),
		})
		MeshRenderer.setPlane(uiEntity)
		Material.setPbrMaterial(uiEntity, {
			texture         : Material.Texture.Avatar({ userId }),
			transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
			castShadows     : false,

		})
	}

	function removeAllEntities() {
		for (const entity of entities) {
			engine.removeEntity(entity)
		}
		entities.length = 0
	}
}