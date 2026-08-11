import type { Layer } from '@stom66/dcl-ui-component-kit'
import { toastHostLayer } from '@stom66/dcl-ui-component-kit'

import { fuelLayer } from 'src/client/ui/themes/skyChaser/layers/fuel.layer'
import { howToPlayLayer } from 'src/client/ui/themes/skyChaser/layers/howToPlay.layer'
import { howToPlayButtonLayer } from 'src/client/ui/themes/skyChaser/layers/howToPlayButton.layer'
import { loadingLayer } from 'src/client/ui/themes/skyChaser/layers/loading.layer'
import { resultsLayer } from 'src/client/ui/themes/skyChaser/layers/results.layer'
import { roundTimerLayer } from 'src/client/ui/themes/skyChaser/layers/roundTimer.layer'
import { scoreboardLayer } from 'src/client/ui/themes/skyChaser/layers/scoreboard.layer'
import { startButtonLayer } from 'src/client/ui/themes/skyChaser/layers/startButton.layer'


howToPlayLayer.setButtonLayer(howToPlayButtonLayer)


/**
 * skyChaser layer list.
 * Loading is registered last so it paints above other layers until dismissed.
 */
export const layers: Layer[] = [
	scoreboardLayer,
	fuelLayer,
	startButtonLayer,
	roundTimerLayer,
	howToPlayLayer,
	howToPlayButtonLayer,
	resultsLayer,
	toastHostLayer,
	loadingLayer,
]
