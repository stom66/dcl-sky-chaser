import ReactEcs, { Button, UiEntity} from '@dcl/sdk/react-ecs'
import { Color4 } from "@dcl/sdk/math"

import { theme, alpha, lighten, darken } from './index'

// MARK: SectionHeader
export const SectionHeader = ({ title }: { title: string }) => {
	return (
		<UiEntity
		uiTransform={{
			width: '100%',
			height: 'auto',
			padding: { top: 10, bottom: 5 }
		}}
		uiText={{
			value: title,
			fontSize: 20,
			color: Color4.create(1, 0.8, 0.3, 1),
			textAlign: 'middle-left'
		}}
		/>
	)
}


// MARK: Divider
export const Divider = () => {
	return (
		<UiEntity
		uiTransform={{
			width: '100%',
			height: 2,
			margin: { top: 10, bottom: 10 }
		}}
		uiBackground={{
			color: Color4.create(0.3, 0.3, 0.3, 1)
		}}
		/>
	)
}



// MARK: ButtonAction
const ButtonActionHoverStates: Map<string, boolean> = new Map()
export const ButtonAction = (
	{ textLabel, callback }: {
		callback : () => void | undefined
		textLabel: string
	}
) => {
	const btnId = textLabel
	return (
		<Button
			key={btnId}
			uiTransform={{
				width       : "100%",
				height      : 40,
				margin      : 4,
				borderRadius: 8,
				borderColor : ButtonActionHoverStates.get(btnId) ? lighten(theme.colors.primary, 0.1) : darken(theme.colors.primary, 0.1),
				borderWidth : 2
			}}
			value={textLabel}
			fontSize={14}
			onMouseDown  = {() => { callback!() }}
			onMouseEnter = {() => { ButtonActionHoverStates.set(btnId, true)  }}
			onMouseLeave = {() => { ButtonActionHoverStates.set(btnId, false) }}
			uiBackground = {{ color: theme.colors.primary }}
		/>
	)
}


// MARK: InfoRow
export const InfoRow = ({ label, value, fontSize, firstColumnWidth }: { label: string; value: string, fontSize?: number, firstColumnWidth?: number }) => {
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

