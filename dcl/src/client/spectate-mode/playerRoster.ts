import { Entity } from "@dcl/sdk/ecs"
import { onEnterScene, onLeaveScene } from "@dcl/sdk/players"


export namespace SM_PlayerRoster {

	// MARK: Vars
	let playerEntities: Map<string, Entity> = new Map()
	let currentPlayer : string | null       = null
	let players       : string[]            = []


	// MARK: Scene Events
	onEnterScene((player) => {
		if (!player) return
		console.log("SM_PlayerRoster: onEnterScene: ENTERED SCENE", player)
		players.push(player.userId)
		playerEntities.set(player.userId, player.entity)
	})

	onLeaveScene((userId) => {
		if (!userId) return
		console.log("SM_PlayerRoster: onLeaveScene: LEFT SCENE", userId)
		players = players.filter((player) => player !== userId)
		playerEntities.delete(userId)
	})


	// MARK: getPlayerCount
	/**
	 * Returns how many players are currently tracked in the scene.
	 */
	export function getPlayerCount(): number {
		return players.length
	}


	// MARK: getCurrentPlayerUserId
	/**
	 * Returns the follow-target user id, or null when free-cam is active.
	 */
	export function getCurrentPlayerUserId(): string | null {
		return currentPlayer
	}


	// MARK: getCurrentPlayerEntity
	/**
	 * Returns the follow-target entity, or null when free-cam is active.
	 */
	export function getCurrentPlayerEntity(): Entity | null {
		if (!currentPlayer) return null
		return playerEntities.get(currentPlayer) ?? null
	}


	// MARK: updatePlayerIndex
	/**
	 * Cycles the follow target by delta. Index -1 is treated as no target (free-cam).
	 */
	export function updatePlayerIndex(delta: number) {
		// No current player? Go to first or last entry
		if (!currentPlayer) {
			if (delta > 0) {
				currentPlayer = players[delta - 1]
			} else {
				currentPlayer = players[players.length - Math.abs(delta)]
			}
			return currentPlayer
		}

		const currentIndex = players.indexOf(currentPlayer)

		// Treat index -1 as "no target"
		let newIndex = currentIndex + delta
		if (newIndex < -1) {
			newIndex += (players.length + 1)
		} else if (newIndex >= players.length) {
			newIndex -= (players.length + 1)
		}

		currentPlayer = players[newIndex]
		return currentPlayer
	}

}
