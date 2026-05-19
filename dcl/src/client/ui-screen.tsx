import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'

import { FORCE_DEBUG } from 'src/shared/settings'
import { DebugUI } from 'src/client/ui/layouts/ui.debug'

import { VersionUI } from 'src/client/ui/layouts/ui.version'
import { FuelUI } from './ui/layouts/ui.fuel'
import { ScoreboardUI } from './ui/layouts/ui.scoreboard'
import { ComboUI } from './ui/layouts/ui.combo'
import { HowToPlayUI } from './ui/layouts/ui.howToPlay'
import { CountdownUI } from './ui/layouts/ui.countdown'


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
		{SHOW_DEBUG || FORCE_DEBUG ? DebugUI() : null}

		{FuelUI()}
		{ScoreboardUI()}
		{ComboUI()}
		{HowToPlayUI()}
		{CountdownUI()}
	</UiEntity>
)


// MARK: SetupUI
export function SetupUI() {
	ReactEcsRenderer.setUiRenderer(uiComponent)
}
