import ReactEcs, { UiEntity} from '@dcl/sdk/react-ecs'

import { ComponentStore, C_GameData } from 'src/shared/components/componentStore'

import { ClientMessaging } from 'src/client/clientMessaging'
import { alpha, theme } from 'src/client/ui/index'
import { ButtonAction, Divider, InfoRow, SectionHeader } from 'src/client/ui/components'
import { PlayerMover } from 'src/client/playerMover'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { ParticleSpawner } from 'src/client/particleSpawner'
import { engine, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { ClientHandler } from 'src/client/clientHandler'
import { PlayerStats } from 'src/server/metrics/playerStats'


// MARK: Vars


// MARK: OnChange Listener


// MARK: Main
export function DebugUI() {
	return (
		<UiEntity
			key         = "ui_debug_root"
			uiTransform = {{
				width         : 240,
				height        : 420,
				flexDirection : 'column',
				alignItems    : 'flex-start',
				justifyContent: 'space-between',
				margin        : { top : '-220px', right: '50px' },
				padding       : '10px',
				position      : { left: 65, top: 350 },
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
				<ButtonAction textLabel="addPoints" callback={() => ClientMessaging.RequestStatsUpdate(PlayerStats.COLLECTED_BALLOONS) } />
				<ButtonAction textLabel="triggerDustSpurt" callback={() => ParticleSpawner.TriggerDustSpurt(Transform.getOrNull(engine.PlayerEntity)?.position ?? Vector3.create(256, 63.2, 256)) } />
				<ButtonAction textLabel="triggerLeaderboardWinner" callback={() => ClientHandler.handleNotifyLeaderboardWinner("ALL TIME") } />
					
				{/* 
				<ButtonAction textLabel="incrementScore" callback={() => ClientMessaging.RequestScoreUpdate() } /> 
				*/}
			</UiEntity>

			<Divider />

			<UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
				<SectionHeader title="Vars" />

				<InfoRow
					label="StartTime"
					value={ComponentStore.getGameStartTime().toString()}
				/>

				<InfoRow
					label="LeaderboardAllTime"
					firstColumnWidth={75}
					value={ComponentStore.getLeaderboardAllTime().length.toString()}
				/>

				<InfoRow
					label="LeaderboardWeekly"
					firstColumnWidth={75}
					value={ComponentStore.getLeaderboardWeekly().length.toString()}
				/>
			</UiEntity>

		</UiEntity>
	)
}
