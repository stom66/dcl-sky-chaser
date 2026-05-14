import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'

import { VERSION } from 'src/shared/data/version'
import { alpha, theme } from 'src/client/ui/index'

// MARK: Main GameUI
export function VersionUI() {
	return (
		<UiEntity
			key={`ui_Version`}
			uiTransform={{
				width       : 'auto',
				height      : '22',
				positionType: "absolute",
				position    : { bottom: 3, right: 3 },
				borderRadius: 12,
				padding     : { right : 4, left: 4 }
			}}
			uiText={{
				value    : VERSION,
				fontSize : 10,
				color    : alpha(theme.colors.light, 0.3),
				textAlign: 'bottom-right',
			}}
			uiBackground={{
				color: alpha(theme.colors.body, 0.2),
			}}
		/>
	)
}
