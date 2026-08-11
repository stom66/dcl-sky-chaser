import { SetupUiComponentKit } from '@stom66/dcl-ui-component-kit'

import { skyChaser } from 'src/client/ui/themes/skyChaser'


// MARK: SetupUI
/**
 * Mounts the SkyChaser UI Component Kit theme and layers.
 */
export function SetupUI() {
	SetupUiComponentKit({
		theme : skyChaser.theme,
		layers: skyChaser.layers,
	})
}
