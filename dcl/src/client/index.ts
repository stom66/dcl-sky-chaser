import { engine, Transform, GltfContainer } from '@dcl/sdk/ecs'
import { getPlayer, onEnterScene } from '@dcl/sdk/players'
import { isStateSyncronized } from '@dcl/sdk/network'
import * as utils from "@dcl-sdk/utils"

import { ComponentManager } from 'src/shared/components/componentManager'
import { ComponentStore } from 'src/shared/components/componentStore'
import { GameSettings, SceneSettings } from "src/shared/settings"

import { ClientHandler } from 'src/client/clientHandler'
import { ClientStore } from 'src/client/clientStore'


export function initClient() {
	
	// MARK: Enter Scene Trigger
	var hasEnteredScene = false
	onEnterScene((player) => {
		hasEnteredScene = true
	})

	// MARK: Wait for Load
	function waitForLoad() {
		// Wait for userData to be available
		let userData = getPlayer()
		if(!userData)                                  {console.log("waitForLoad: userData");           return}

		// Wait for them to have entered the scene
		if (!hasEnteredScene)                          {console.log("waitForLoad: onEnterScene");       return}

		// wait for components to sync
		if (!isStateSyncronized())                     {console.log("waitForLoad: isStateSyncronized"); return}

		// Wait for the player entity and camera to be present
		if (!Transform.getOrNull(engine.PlayerEntity)) {console.log("waitForLoad: PlayerEntity");       return}
		if (!Transform.getOrNull(engine.CameraEntity)) {console.log("waitForLoad: CameraEntity");       return}

		engine.removeSystem(waitForLoad)

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
		const { SetupUI } = await import('src/client/ui-screen')
		SetupUI()
	})


	// MARK: Scene Parent
	const _scene = engine.addEntity()
	Transform.create(_scene, SceneSettings.SCENE_TRANSFORM_180)


	// MARK: Scene Assets
	let asset1 = engine.addEntity()
	Transform.create(asset1, SceneSettings.SCENE_TRANSFORM)
	Transform.getMutable(asset1).parent = _scene
	GltfContainer.create(asset1, {
		src: "models/example_model.gltf"
	})


	engine.addSystem(waitForLoad)
}
