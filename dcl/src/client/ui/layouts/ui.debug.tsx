import ReactEcs, { UiEntity} from '@dcl/sdk/react-ecs'

import { ComponentStore, C_GameData } from 'src/shared/components/componentStore'

import { ClientMessaging } from 'src/client/clientMessaging'
import { alpha, theme } from 'src/client/ui/index'
import { ButtonAction, Divider, InfoRow, SectionHeader } from 'src/client/ui/components'
import { PlayerMover } from 'src/client/playerMover'


// MARK: Vars


// MARK: OnChange Listener


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

				<ButtonAction textLabel="toSpawn" callback={() => PlayerMover.movePlayerToSpawn() } />
				<ButtonAction textLabel="newGame" callback={() => ClientMessaging.RequestNewGame() } />
				<ButtonAction textLabel="scoreUpdate" callback={() => ClientMessaging.RequestScoreUpdate() } />
			</UiEntity>

			<Divider />

			<UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
				<SectionHeader title="Vars" />

				<InfoRow
					label="StartTime"
					value={ComponentStore.getGameStartTime().toString()}
				/>

			</UiEntity>

		</UiEntity>
	)
}
