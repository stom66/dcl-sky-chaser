import { Color4 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs from '@dcl/sdk/react-ecs'
import {
	atlasIconsFontAwesome,
	Icon,
	Layer,
	Spinner,
	UiBox,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


/** Artboard size of `loading-fg.png`. */
const FG_ART_WIDTH  = 512
const FG_ART_HEIGHT = 256

/** Spinner placement in artboard pixels (center + size). */
const SPINNER_ART_SIZE     = 90
const SPINNER_ART_CENTER_X = 760 / 2
const SPINNER_ART_CENTER_Y = 244 / 2

/** Display size in vw (25% wide, half that tall → keeps 2:1 art ratio). */
const FG_WIDTH_VW  = isMobile() ? 35 : 25
const FG_HEIGHT_VW = FG_WIDTH_VW * (FG_ART_HEIGHT / FG_ART_WIDTH)

const SPINNER_WIDTH_VW = (SPINNER_ART_SIZE / FG_ART_WIDTH) * FG_WIDTH_VW
const SPINNER_HEIGHT_VW = (SPINNER_ART_SIZE / FG_ART_HEIGHT) * FG_HEIGHT_VW
const SPINNER_LEFT_VW = ((SPINNER_ART_CENTER_X - SPINNER_ART_SIZE / 2) / FG_ART_WIDTH) * FG_WIDTH_VW
const SPINNER_TOP_VW  = ((SPINNER_ART_CENTER_Y - SPINNER_ART_SIZE / 2) / FG_ART_HEIGHT) * FG_HEIGHT_VW


// MARK: LoadingLayer
/**
 * Full-screen loading overlay. Hides when `ClientEvents.LOAD_COMPLETE` fires.
 * BG is painted on the Zone; FG is a sized box so absolute children cannot escape.
 */
export class LoadingLayer extends Layer {
	constructor() {
		super({
			id         : 'skyChaser-loading',
			zone       : ZoneType.FullScreen,
			canBeHidden: true,
			startHidden: false,
			zIndex     : 2000,
			uiBackground: {
				texture    : { src: 'assets/images/ui/loading-bg.png', wrapMode: 'clamp' },
				textureMode: 'stretch',
				color      : Color4.White(),
			},
			uiTransform: {
				justifyContent: 'center',
				alignItems    : 'center',
				borderWidth   : 0,
			},
		})

		eventBus.on(ClientEvents.LOAD_COMPLETE, () => {
			this.hide()
		})
	}


	// MARK: body
	protected body() {
		return [
			<UiBox
				key         = "loading-fg"
				width       = {`${FG_WIDTH_VW}vw`}
				height      = {`${FG_HEIGHT_VW}vw`}
				borderWidth = {0}
				overflow    = "hidden"
				margin      = {{ top: "17%" }}
				uiBackground = {{
					texture    : { src: 'assets/images/ui/loading-fg.png', wrapMode: 'clamp' },
					textureMode: 'stretch',
					color      : Color4.White(),
				}}
			>
				<Spinner
					key           = "loading-spinner"
					id            = "loading-spinner"
					duration      = {1}
					degrees       = {360}
					burstInterval = {0}
					width         = {`${SPINNER_WIDTH_VW}vw`}
					height        = {`${SPINNER_HEIGHT_VW}vw`}
					uiTransform   = {{
						positionType: 'absolute',
						position    : {
							left: `${SPINNER_LEFT_VW}vw`,
							top : `${SPINNER_TOP_VW}vw`,
						},
					}}
				>
					<Icon
						uvs    = {atlasIconsFontAwesome.uv.dots}
						width  = {`${SPINNER_WIDTH_VW}vw`}
						height = {`${SPINNER_HEIGHT_VW}vw`}
					/>
				</Spinner>
			</UiBox>,
		]
	}
}

export const loadingLayer = new LoadingLayer()
