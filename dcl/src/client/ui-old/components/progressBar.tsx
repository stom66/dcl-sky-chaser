import ReactEcs, { UiEntity, UiTransformProps} from '@dcl/sdk/react-ecs'

import { theme, alpha, lighten, darken } from '../index'
import { getUVsForIconAtlasRow } from '../utils/atlas'


enum ButtonIndex {
	DEFAULT  = 3,
	HOVER    = 2,
	PRESS    = 1,
	DISABLED = 0,
}
var buttonIndex: ButtonIndex = ButtonIndex.DEFAULT

const currentIndex : Map<String, number> = new Map()
const hoverStates  : Map<string, Boolean>   = new Map()
const pressedStates: Map<string, Boolean>   = new Map()

// MARK: SectionHeader
export const ProgressBar = ({ 
	setRatio     = (): number => 0,
	uiTransform  = {},
	children     = [],
	isHorizontal = true,
 }: { 
	setRatio?    : () => number,
	uiTransform? : UiTransformProps,
	children?    : ReactEcs.JSX.Element[],
	isHorizontal?: boolean,
}) => {
	const id = Math.random().toString()
	return (
		<UiEntity
			key         = {`ui_Combo_outer`}
			uiTransform = {{
				width         : 420,
				height        : 90,
				borderRadius  : 45,
				overflow      : 'hidden',
				flexDirection : isHorizontal ? 'row' : 'column',
				justifyContent: 'flex-start',
				borderColor   : darken(theme.colors.primary, 0.05),
				borderWidth   : 5,
				alignItems    : 'center',
				positionType  : 'relative',
				...uiTransform
			}}

		>
			<UiEntity
				key={`ui_Combo_inner_fill`}
				uiTransform={{
					height      : isHorizontal ? '100%'              : `${100-setRatio()}%`,
					width       : isHorizontal ? `${100-setRatio()}%`: '100%',
					alignContent: 'center',
				}}
				uiBackground={{
					color: alpha(theme.colors.primary, 1),
				}}
			/>
			<UiEntity
				key={`ui_Combo_inner_empty`}
				uiTransform={{
					width        : '100%',
					height       : '100%',
					alignContent : 'center',
					positionType : 'absolute',
					alignSelf    : 'center',
					flexDirection: 'row',
				}}
			>
				{children}
			</UiEntity>
		</UiEntity>
	)
}


