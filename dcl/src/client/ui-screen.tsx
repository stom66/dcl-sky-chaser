import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'

import { DebugUI } from 'src/client/ui/layouts/ui.debug'
import { VersionUI } from 'src/client/ui/layouts/ui.version'
import { FuelUI } from './ui/layouts/ui.fuel'
import { ScoreboardUI } from './ui/layouts/ui.scoreboard'


// MARK: Vars
declare var process: {
    env: {
        NODE_ENV: string
    }
}
const env = process.env.NODE_ENV
const SHOW_DEBUG = env == "development"


// MARK: Main
const uiComponent = () => (
	<UiEntity
		uiTransform={{
			width : '100%',
			height: '100%',
		}}
	>
		{VersionUI()}
		{SHOW_DEBUG ? DebugUI() : null}

		{FuelUI()}
		{ScoreboardUI()}
	</UiEntity>
)


// MARK: SetupUI
export function SetupUI() {
	ReactEcsRenderer.setUiRenderer(uiComponent)
}
