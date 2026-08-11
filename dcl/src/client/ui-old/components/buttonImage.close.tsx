import { UiTransformProps } from '@dcl/sdk/react-ecs'

import { ButtonImage } from 'src/client/ui-old/components/index'

// MARK: ButtonImageClose
/**
 * Renders the shared close button image component.
 */
export const ButtonImageClose = ({
	id          = "uiid",
	callback    = undefined,
	uiTransform = {}
} : { 
	id          : string,
	callback?   : () => void,
	uiTransform?: UiTransformProps,
}) => {
	return ButtonImage({
		id         : id,
		width      : 90,
		height     : 90,
		textureSrc : "assets/images/ui/atlas-btn-close.png",
		uiTransform: uiTransform,
		callback   : () => {
			if (callback !== undefined) {
				callback()
			}
		}
	})
}
