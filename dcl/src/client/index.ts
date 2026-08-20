import { engine, Transform, GltfContainer } from '@dcl/sdk/ecs'
import { getPlayer, onEnterScene } from '@dcl/sdk/players'
import { isStateSyncronized } from '@dcl/sdk/network'
import * as utils from "@dcl-sdk/utils"

import { ComponentManager } from 'src/shared/components/componentManager'
import { ComponentStore } from 'src/shared/components/componentStore'
import { GameSettings, IS_DEV, SceneSettings } from "src/shared/settings"
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { DiscordWebhooks } from 'src/shared/utils/discord-webhooks'

import { ClientHandler } from 'src/client/clientHandler'
import { ClientStore } from 'src/client/clientStore'
import { GameStateManager } from './gameStateManager'

import { SetupUI } from 'src/client/ui'
import { SoundManager } from './soundManager'

import { Light } from './light'
import { UILeaderboard } from './ui-leaderboard'
import { FireworkLauncher } from './fireworkLauncher'
import { SpectateMode } from './spectate-mode'
import { NoticeBoard } from './noticeBoard'

import { BirdSpawner } from './spawners/birdSpawner'
import { BounceSpawner } from './spawners/bounceSpawner'
import { ParticleSpawner } from './particleSpawner'
import { ProjectileManager } from './projectileManager'
import { SpawnManager } from './spawners/pickupSpawner'
import { TriggerSpawner } from './spawners/triggerSpawner'


import { BeaconManager } from './beaconManager'
import { BoosterInput } from './boosterInput'
import { ComboManager } from './comboManager'
import { LocomotionController } from './locomotionController'
import { isMobile } from '@dcl/sdk/platform'
import { TouchscreenControls } from './touchscreenControls'

var loadingNow = ""
export function getLoadingNow() {
	return loadingNow === "" ? "?" : loadingNow
}

export function initClient() {

	loadingNow = "initClient"

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
				loadingNow = "!getPlayer()"
				if (!getPlayer())                                  { console.log("waitForLoad: userData");           return }
				loadingNow = "!onEnterScene()"
				if (!hasEnteredScene)                              { console.log("waitForLoad: onEnterScene");       return }
				loadingNow = "!isStateSyncronized()"
				if (!isStateSyncronized())                         { console.log("waitForLoad: isStateSyncronized"); return }
				loadingNow = "!engine.playerEntity"
				if (!Transform.getOrNull(engine.PlayerEntity))     { console.log("waitForLoad: PlayerEntity");       return }
				loadingNow = "!engine.playerCamera"
				if (!Transform.getOrNull(engine.CameraEntity))     { console.log("waitForLoad: CameraEntity");       return }
				loadingNow = "Resolving promises..."

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

	// Load the UI first, so we get the loading screen
	SetupUI()


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


		LocomotionController.init()
		ComboManager.init()
		SoundManager.init()
		BoosterInput.init()

		SpawnManager.init()
		TriggerSpawner.spawnTriggers()

		UILeaderboard.init()

		BirdSpawner.init()

		BounceSpawner.init()

		ProjectileManager.init()
		NoticeBoard.init()
		FireworkLauncher.init()
		SpectateMode.init()

		if (!isMobile()) {
			BeaconManager.init()
			Light.init()
			ParticleSpawner.init()
		}

		if (isMobile()) {
			TouchscreenControls.init()
		}

		onGameLoaded()
	})
}
