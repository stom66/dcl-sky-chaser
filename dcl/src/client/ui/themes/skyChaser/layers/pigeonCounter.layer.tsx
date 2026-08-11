import { Color4 } from '@dcl/sdk/math'
import ReactEcs from '@dcl/sdk/react-ecs'
import {
	Background,
	IconNumber,
	Layer,
	PropsController,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { charsNumbersAtlas } from 'src/client/ui/themes/skyChaser/atlases'
import { C_PigeonCounter, ComponentStore } from 'src/shared/components/componentStore'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'


const PANEL_WIDTH  = 256
const PANEL_HEIGHT = 128

/** Digit slot on `bg-counter.png` — fixed width so multi-digit counts stay right-aligned. */
const COUNT_WIDTH  = 66
const COUNT_HEIGHT = 50
const COUNT_TOP    = 52
const COUNT_LEFT   = 0

const COUNTER_BG_SRC = 'assets/images/ui/bg-counter.png'

type PigeonCounterProps = {
	count: number
}


// MARK: PigeonCounterLayer
/**
 * BottomRight pigeon find counter. Background chrome + `IconNumber` for `count`.
 * Shows when the count increases; hides on reset (0) or when all pigeons are found.
 */
export class PigeonCounterLayer extends Layer {
	constructor() {
		super({
			id         : 'skyChaser-pigeonCounter',
			zone       : ZoneType.BottomRight,
			canBeHidden: true,
			startHidden: true,
			uiTransform: {
				width         : PANEL_WIDTH,
				height        : PANEL_HEIGHT,
				justifyContent: 'flex-end',
				alignItems    : 'flex-end',
			},
		})

		this.props = new PropsController<PigeonCounterProps>({
			count: 0,
		})

		ComponentStore.onComponentChange(C_PigeonCounter.PigeonCounter, (data) => {
			const newCount  = data?.count ?? 0
			const prevCount = this.props!.get('count') as number

			this.props!.set('count', newCount)

			if (newCount > prevCount && this.visibility.isHidden) {
				this.show()
			}
			if (newCount === 0) {
				this.hide()
			}
		})

		eventBus.on(ClientEvents.PLAYER_FOUND_ALL_PIGEONS, () => {
			this.hide()
		})
	}


	// MARK: body
	protected body() {
		const count = this.props!.get('count') as number

		return [
			<Background
				key             = "pigeon-counter-chrome"
				textureSrc      = {COUNTER_BG_SRC}
				backgroundColor = {Color4.White()}
				borderRadius    = {0}
				borderWidth     = {0}
			/>,
			<IconNumber
				key         = "pigeon-counter-count"
				value       = {count}
				width       = {COUNT_WIDTH}
				height      = {COUNT_HEIGHT}
				atlas       = {charsNumbersAtlas}
				iconColor   = {Color4.White()}
				uiTransform = {{
					positionType  : 'absolute',
					position      : { top: COUNT_TOP, left: COUNT_LEFT },
					justifyContent: 'flex-end',
				}}
			/>,
		]
	}
}

export const pigeonCounterLayer = new PigeonCounterLayer()
