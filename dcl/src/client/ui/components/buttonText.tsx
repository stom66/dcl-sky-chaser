import { Color4 } from "@dcl/sdk/math"
import ReactEcs, { Button, PositionUnit, UiTransformProps} from '@dcl/sdk/react-ecs'

import { darken, lighten, theme } from 'src/client/ui/index'



// MARK: Vars
const hoverStates  : Map<string, Boolean>   = new Map()
const pressedStates: Map<string, Boolean>   = new Map()

// MARK: ButtonText
/**
 * Renders a text button with hover styling and an optional click callback.
 */
export const ButtonText = ({ 
	textLabel   = "Button text", 
	width       = "100%", 
	height      = 64,
	borderWidth = 2,
	borderColor = theme.colors.primary,
	uiTransform,
	callback 
}: {
	textLabel    : string,
	width      ? : PositionUnit | "auto" | undefined, 
	height     ? : PositionUnit | "auto" | undefined, 
	textureSrc ? : string,
	borderWidth ?: number,
	borderColor ?: Color4,
	uiTransform? : UiTransformProps,
	callback   ? : () => void 
}) => {
	const btnId = textLabel

	return (
		<Button
			key         = {btnId}
			uiTransform = {{
				width       : width,
				height      : height,
				margin      : 4,
				borderRadius: 4,
				borderColor : hoverStates.get(btnId) ? lighten(borderColor, 0.1) : darken(borderColor, 0.1),
				borderWidth : borderWidth,
				...uiTransform
			}}
			value        = {textLabel}
			fontSize     = {14}
			onMouseEnter = {() => { 
				hoverStates.set(btnId, true)
			}}
			onMouseLeave = {() => { 
				hoverStates.set(btnId, false)
			}}
			onMouseDown  = {() => { 
				pressedStates.set(btnId, true)
			}}
			onMouseUp    = {() => { 
				pressedStates.set(btnId, false)

				if (hoverStates.get(btnId) === true) {
					callback?.()
				}
			}}
			uiBackground = {{ 
				color: borderColor 
			}}
		/>
	)
}


