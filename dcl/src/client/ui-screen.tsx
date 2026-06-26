import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import * as utils from '@dcl-sdk/utils'

import { DebugUI } from 'src/client/ui/layouts/ui.debug'

import { VersionUI } from 'src/client/ui/layouts/ui.version'
import { FuelUI } from './ui/layouts/ui.fuel'
import { ScoreboardUI } from './ui/layouts/ui.scoreboard'
import { ComboUI } from './ui/layouts/ui.combo'
import { HowToPlayUI } from './ui/layouts/ui.howToPlay'
import { CountdownUI } from './ui/layouts/ui.countdown'
import { LeaderboardWinnerUI } from './ui/layouts/ui.leaderboardWinner'
import { ResultsUI } from './ui/layouts/ui.results'
import { PigeonCounterUI } from './ui/layouts/ui.pigeonCounter'
import { EnableHints, HintsUI } from './ui/layouts/ui.hints'


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
		{ComboUI()}
		{HowToPlayUI()}
		{CountdownUI()}
		{LeaderboardWinnerUI()}
		{ResultsUI()}
		{PigeonCounterUI()}

		{HintsUI()}
	</UiEntity>
)


// MARK: SetupUI
export function SetupUI() {
	utils.timers.setTimeout(() => {
		EnableHints()
	}, 1000 * 30) // 30 seconds

	ReactEcsRenderer.setUiRenderer(uiComponent, {
		virtualWidth: 1920,
		virtualHeight: 1080,
	})
}
