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


export function initClient() {
	
	// MARK: Enter Scene Trigger
	var hasEnteredScene = false
	onEnterScene((player) => {
		hasEnteredScene = true

		if (!IS_DEV) DiscordWebhooks.newPlayer(player.name, player.userId)
	})

	// MARK: Wait for Load
	function sys_waitForLoad() {
		// Wait for userData to be available
		let userData = getPlayer()
		if(!userData)                                  {console.log("waitForLoad: userData");                   return}

		// Wait for them to have entered the scene
		if (!hasEnteredScene)                          {console.log("waitForLoad: onEnterScene");               return}

		// wait for components to sync
		if (!isStateSyncronized())                     {console.log("waitForLoad: isStateSyncronized");         return}

		// Wait for the player entity and camera to be present
		if (!Transform.getOrNull(engine.PlayerEntity)) {console.log("waitForLoad: PlayerEntity");               return}
		if (!Transform.getOrNull(engine.CameraEntity)) {console.log("waitForLoad: CameraEntity");               return}

		if (!ComponentManager.isReady())               {console.log("waitForLoad: ComponentManager not ready"); return}

		engine.removeSystem(sys_waitForLoad)

		onGameLoaded()
	}

	// MARK: On Game Loaded
	function onGameLoaded() {
		console.log("onGameLoaded")
		utils.timers.setTimeout(() => {
			//HideLoading()
		}, GameSettings.LOADING_SCREEN_DELAY) 
	}



	// MARK: Client Store
	void ClientStore.getInstance()
	ClientHandler.init()

	// MARK: Component Store
	ComponentManager.init()
	void ComponentManager.onClientReady().then(async () => {
		// Delay loading anything which requires the component until here
		ComponentStore.init()
		GameStateManager.init()

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

		const { SetupUI } = await import('src/client/ui-screen')
		SetupUI()
	})


	// Load game specific stuff

	engine.addSystem(sys_waitForLoad)
}
