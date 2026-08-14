import { engine, Transform, GltfContainer } from '@dcl/sdk/ecs'
import { getPlayer, onEnterScene } from '@dcl/sdk/players'
import { isStateSyncronized } from '@dcl/sdk/network'
import * as utils from "@dcl-sdk/utils"

import { ComponentManager } from 'src/shared/components/componentManager'
import { ComponentStore } from 'src/shared/components/componentStore'
import { GameSettings, IS_DEV, SceneSettings } from "src/shared/settings"

import { ClientHandler } from 'src/client/clientHandler'
import { ClientStore } from 'src/client/clientStore'
import { TriggerSpawner } from './spawners/triggerSpawner'
import { LocomotionController } from './locomotionController'
import { SoundManager } from './soundManager'
import { BoosterInput } from './boosterInput'
import { ComboManager } from './comboManager'
import { ParticleSpawner } from './particleSpawner'
import { DiscordWebhooks } from 'src/shared/utils/discord-webhooks'
import { GameStateManager } from './gameStateManager'
import { UILeaderboard } from './ui-leaderboard'
import { BeaconManager } from './beaconManager'
import { BirdSpawner } from './spawners/birdSpawner'
import { Light } from './light'
import { BounceSpawner } from './spawners/bounceSpawner'
import { ProjectileManager } from './projectileManager'
import { spawn } from '~system/PortableExperiences'
import { SpawnManager } from './spawners/pickupSpawner'
import { NoticeBoard } from './noticeBoard'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { FireworkLauncher } from './fireworkLauncher'


export function initClient() {

	// MARK: Enter Scene Trigger
	var hasEnteredScene = false
	onEnterScene((player) => {
		hasEnteredScene = true

		if (!IS_DEV) DiscordWebhooks.newPlayer(player.name, player.userId)
	})


	// MARK: waitForSceneReady
	/**
	 * Resolves once the local player, camera, and network sync are available.
	 */
	function waitForSceneReady(): Promise<void> {
		return new Promise((resolve) => {
			function sys_waitForLoad() {
				if (!getPlayer())                                  { console.log("waitForLoad: userData");           return }
				if (!hasEnteredScene)                              { console.log("waitForLoad: onEnterScene");       return }
				if (!isStateSyncronized())                         { console.log("waitForLoad: isStateSyncronized"); return }
				if (!Transform.getOrNull(engine.PlayerEntity))     { console.log("waitForLoad: PlayerEntity");       return }
				if (!Transform.getOrNull(engine.CameraEntity))     { console.log("waitForLoad: CameraEntity");       return }

				engine.removeSystem(sys_waitForLoad)
				resolve()
			}

			engine.addSystem(sys_waitForLoad)
		})
	}


	// MARK: On Game Loaded
	/**
	 * Emits LOAD_COMPLETE after the loading-screen delay.
	 * Call only after SetupUI so layer constructors have already subscribed.
	 */
	function onGameLoaded() {
		console.log("onGameLoaded")
		utils.timers.setTimeout(() => {
			eventBus.emit(ClientEvents.LOAD_COMPLETE, {})
		}, GameSettings.LOADING_SCREEN_DELAY)
	}


	// MARK: Client Store
	void ClientStore.getInstance()
	ClientHandler.init()
	ComponentManager.init()

	// Scene gate + component gate — then one sequential init path.
	// SetupUI runs first so LOAD_COMPLETE subscribers exist before onGameLoaded.
	void Promise.all([
		waitForSceneReady(),
		ComponentManager.onClientReady(),
	]).then(async () => {
		ComponentStore.init()
		GameStateManager.init()

		const { SetupUI } = await import('src/client/ui-screen')
		SetupUI()

		LocomotionController.init()
		ComboManager.init()
		SoundManager.init()
		BoosterInput.init()

		SpawnManager.init()
		ParticleSpawner.init()
		TriggerSpawner.spawnTriggers()

		UILeaderboard.init()
		BeaconManager.init()

		BirdSpawner.init()
		Light.init()

		BounceSpawner.init()

		ProjectileManager.init()
		NoticeBoard.init()
		FireworkLauncher.init()

		onGameLoaded()
	})
}
