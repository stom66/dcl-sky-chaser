import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { UiEntity, UiTransformProps} from '@dcl/sdk/react-ecs'
import { getPlatform, isMobile, isDesktop, isWeb } from '@dcl/sdk/platform'


import { getUVsForIconAtlasRow } from 'src/client/ui/utils/atlas'


enum ButtonIndex {
	DEFAULT  = 3,
	HOVER    = 2,
	PRESS    = 1,
	DISABLED = 0,
}
const currentIndex : Map<string, number>  = new Map()
const hoverStates  : Map<string, boolean> = new Map()
const pressedStates: Map<string, boolean> = new Map()


// MARK: ButtonImage
/**
 * Renders an image button with per-instance hover and press state.
 */
export const ButtonImage = ({ 
	id,
	width      = 64, 
	height     = 64, 
	textureSrc = "assets/images/ui/atlas-btn-close.png",
	uiTransform,
	callback  ,
}: { 
	id         : string,
	width      ?: number, 
	height     ?: number, 
	textureSrc ?: string,
	uiTransform?: UiTransformProps,
	callback   ?: () => void 
}) => {
	const stateId = id.toString()

	return (
		<UiEntity
			key         = {stateId}
			uiTransform = {{
				width         : width,
				height        : height,
				overflow      : 'hidden',
				positionType  : 'absolute',
				position      : { top: 20, left: -24 },
				...uiTransform
			}}

			uiBackground={{
				texture    : { src: textureSrc },
				textureMode: 'stretch',
				uvs        : getUVsForIconAtlasRow(currentIndex.get(stateId) ?? 3, 4),
				color      : Color4.White(),
			}}

			onMouseEnter = {() => {
				hoverStates.set(stateId, true)
				currentIndex.set(stateId, ButtonIndex.HOVER)
			}}
			onMouseLeave = {() => {
				hoverStates.set(stateId, false)
				currentIndex.set(stateId, ButtonIndex.DEFAULT)
			}}
			onMouseDown  = {() => {
				pressedStates.set(stateId, true)
				currentIndex.set(stateId, ButtonIndex.PRESS)
			}}
			onMouseUp    = {() => {
				pressedStates.set(stateId, false)

				// Mobile users can't hover so work around that
				if (isMobile()) {
					if (callback !== undefined) callback()
					currentIndex.set(stateId, ButtonIndex.DEFAULT)

				} else {					
					if (hoverStates.get(stateId) === true) {
						if (callback !== undefined) callback()
						currentIndex.set(stateId, ButtonIndex.HOVER)
					} else {
						currentIndex.set(stateId, ButtonIndex.DEFAULT)
					}
				}
			}}
		/>
	)
}


