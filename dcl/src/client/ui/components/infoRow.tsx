import ReactEcs, { UiEntity, UiTransformProps} from '@dcl/sdk/react-ecs'
import { Color4 } from "@dcl/sdk/math"

import { theme, alpha, lighten, darken } from '../index'


// MARK: InfoRow
export const InfoRow = ({ 
	label, 
	value, 
	fontSize, 
	firstColumnWidth 
}: { 
	label: string; 
	value: string, 
	fontSize?: number, 
	firstColumnWidth?: number 
}) => {
	return (
		<UiEntity
			uiTransform={{
				width        : '100%',
				height       : 'auto',
				padding      : { top: 5, bottom: 5 },
				flexDirection:  'row'
			}}
		>
			<UiEntity
				uiTransform={{
					width : firstColumnWidth !== undefined ? `${firstColumnWidth}%`: "50%",
					height: 'auto'
				}}
				uiText={{
					value    : label,
					fontSize : fontSize ?? 13,
					color    : Color4.fromHexString("#64abba"),
					textAlign: 'middle-left'
				}}
			/>
			<UiEntity
				uiTransform={{
					width : firstColumnWidth !== undefined ? `${100 - firstColumnWidth}%`: "50%",
					height: 'auto'
				}}
				uiText={{
					value    : value,
					fontSize : fontSize ?? 13,
					color    : Color4.White(),
					textAlign: 'middle-left'
				}}
			/>
		</UiEntity>
	)
}