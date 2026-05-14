import ReactEcs, { UiEntity} from '@dcl/sdk/react-ecs'

import { ComponentStore, C_FooBar } from 'src/shared/components/componentStore'

import { ClientMessaging } from 'src/client/clientMessaging'
import { alpha, theme } from 'src/client/ui/index'
import { ButtonAction, Divider, InfoRow, SectionHeader } from 'src/client/ui/components'


// MARK: Vars
var foo = ComponentStore.getFooBar().foo ?? 'loading...'
var bar = ComponentStore.getFooBar().bar ?? 0


// MARK: OnChange Listener
ComponentStore.onComponentChange(C_FooBar.FooBar, (data) => {
	console.log('DebugUI: onComponentChange', data)
	foo = data?.foo ?? 'loading...'
	bar = data?.bar ?? 0
})


// MARK: Main
export function DebugUI() {
	return (
		<UiEntity
			key         = "ui_debug_root"
			uiTransform = {{
				width         : 220,
				height        : 240,
				flexDirection : 'column',
				alignItems    : 'flex-start',
				justifyContent: 'space-between',
				margin        : { top : '-220px', right: '50px' },
				padding       : '10px',
				position      : { left: 65, top        : 350 },
				positionType  : "absolute",
				borderRadius  : 8,
			}}
			uiBackground={{ 
				color: alpha(theme.colors.body, 0.5),
			}}
		>

			<UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
				<SectionHeader title="Debug Menu" />

				<ButtonAction textLabel="Foo" callback={() => ClientMessaging.RequestFoo() } />
			</UiEntity>

			<Divider />

			<UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
				<SectionHeader title="Vars" />

				<InfoRow label = "foo" firstColumnWidth={25} value = {foo.toString()} />
				<InfoRow label = "bar" firstColumnWidth={25} value = {bar.toString()} />
			</UiEntity>

		</UiEntity>
	)
}
