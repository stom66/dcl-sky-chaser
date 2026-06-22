import { C_GameData, ComponentStore } from "src/shared/components/componentStore"
import { GameStatus } from "src/shared/enums"
import { ClientEvents, eventBus } from "src/shared/utils/eventBus"

export namespace GameStateManager {

	var previousState: GameStatus = GameStatus.IDLE

    export function init() {
        console.log('GameStateManager: init')

		ComponentStore.onComponentChange(C_GameData.GameData, (data) => {

			console.log("GameStateManager: GameData changed, old state", previousState, "new state", data?.status)

			//console.log("BalloonSpawner: GameData changed", data)
			const newState = data?.status ?? GameStatus.IDLE
			if (newState === previousState) return

			const gameStartTime = data?.startTime ?? 0
			if (gameStartTime === 0) {
				eventBus.emit(ClientEvents.GAME_IDLE, data)
				return
			}

			if (newState === GameStatus.STARTING) {
				eventBus.emit(ClientEvents.GAME_STARTING, data)
			}
			else if (newState === GameStatus.ACTIVE) {
				eventBus.emit(ClientEvents.GAME_ACTIVE, data)
			}
			else if (newState === GameStatus.ENDING) {
				eventBus.emit(ClientEvents.GAME_END, data)
			}
			else if (newState === GameStatus.IDLE) {
				eventBus.emit(ClientEvents.GAME_IDLE, data)

				// Client components reset - fuel and combo
				ComponentStore.resetAfterRound()
			}

			previousState = newState
		})
    }

}
