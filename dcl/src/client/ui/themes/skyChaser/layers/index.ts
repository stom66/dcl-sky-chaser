import type { Layer } from '@stom66/dcl-ui-component-kit'
import { toastHostLayer } from '@stom66/dcl-ui-component-kit'

import { comboLayer } from 'src/client/ui/themes/skyChaser/layers/combo.layer'
import { debugLayer } from 'src/client/ui/themes/skyChaser/layers/debug.layer'
import { fuelLayer } from 'src/client/ui/themes/skyChaser/layers/fuel.layer'
import { howToPlayLayer } from 'src/client/ui/themes/skyChaser/layers/howToPlay.layer'
import { howToPlayButtonLayer } from 'src/client/ui/themes/skyChaser/layers/howToPlayButton.layer'
import { loadingLayer } from 'src/client/ui/themes/skyChaser/layers/loading.layer'
import { pigeonCounterLayer } from 'src/client/ui/themes/skyChaser/layers/pigeonCounter.layer'
import { resultsLayer } from 'src/client/ui/themes/skyChaser/layers/results.layer'
import { roundTimerLayer } from 'src/client/ui/themes/skyChaser/layers/roundTimer.layer'
import { scoreboardLayer } from 'src/client/ui/themes/skyChaser/layers/scoreboard.layer'
import { spectateLayer } from 'src/client/ui/themes/skyChaser/layers/spectate.layer'
import { startButtonLayer } from 'src/client/ui/themes/skyChaser/layers/startButton.layer'
import { versionLayer } from 'src/client/ui/themes/skyChaser/layers/version.layer'
import { goToStartButtonLayer } from 'src/client/ui/themes/skyChaser/layers/goToStartButton'


howToPlayLayer.setButtonLayer(howToPlayButtonLayer)


/**
 * skyChaser layer list.
 * Loading is near the end so it paints above other layers until dismissed.
 * Version is last (FullScreen + highest zIndex) so the badge stays on top.
 */
export const layers: Layer[] = [
	scoreboardLayer,
	fuelLayer,
	comboLayer,
	startButtonLayer,
	spectateLayer,
	roundTimerLayer,
	pigeonCounterLayer,
	howToPlayLayer,
	howToPlayButtonLayer,
	goToStartButtonLayer,
	resultsLayer,
	...(debugLayer ? [debugLayer] : []),
	toastHostLayer,
	loadingLayer,
	versionLayer,
]
