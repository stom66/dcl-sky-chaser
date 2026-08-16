import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import {
	atlasIconsFontAwesome,
	Background,
	Column,
	getTheme,
	Icon,
	Layer,
	PropsController,
	Row,
	Text,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { userProfileCache } from 'src/shared/utils/userProfileCache'

import { scoreboardRowsAtlas } from 'src/client/ui/themes/skyChaser/atlases'


const SCOREBOARD_ROW_STYLE_COUNT = 4
const PANEL_WIDTH                = 280
const HIGH_SCORE_ICON_SIZE       = 16
/** Gold accent for new-high-score trophy (matches results panel). */
const HIGH_SCORE_ACCENT          = Color4.fromHexString('#B4822B')

/**
 * Vertical slice fractions for `scoreboard-bg.png` (1024²).
 * top    = 270 / 1024
 * bottom = 181 / 1024
 *
 * Chrome is an explicit 3-band stack (fixed top / stretching mid / fixed bottom)
 * because native nine-slices was unreliable for this fixed-width panel.
 */
const SCOREBOARD_BG_TOP_FRAC    = 0.2637
const SCOREBOARD_BG_BOTTOM_FRAC = 0.1768
const SCOREBOARD_BG_SRC         = 'assets/images/ui/scoreboard-bg.png'

/** Pixel heights for the fixed caps at the panel's display width (square art). */
const SCOREBOARD_BG_TOP_PX    = PANEL_WIDTH * SCOREBOARD_BG_TOP_FRAC
const SCOREBOARD_BG_BOTTOM_PX = PANEL_WIDTH * SCOREBOARD_BG_BOTTOM_FRAC


// MARK: uvBand
/**
 * Full-width UV quad for a vertical band of the texture (y from bottom → top).
 */
function uvBand(
	yBottom: number,
	yTop   : number,
): number[] {
	return [
		0, yBottom,
		0, yTop,
		1, yTop,
		1, yBottom,
	]
}

const SCOREBOARD_BG_UV_TOP = uvBand(1 - SCOREBOARD_BG_TOP_FRAC, 1)
const SCOREBOARD_BG_UV_MID = uvBand(SCOREBOARD_BG_BOTTOM_FRAC, 1 - SCOREBOARD_BG_TOP_FRAC)
const SCOREBOARD_BG_UV_BOT = uvBand(0, SCOREBOARD_BG_BOTTOM_FRAC)


export type ScoreboardRowData = {
	userId         : string
	displayName    : string
	score          : number
	isNewHighscore?: boolean
}

type ScoreboardProps = {
	rows: ScoreboardRowData[]
}

type ScoreBoardComponentData = {
	scores?: Array<{
		userId        : string
		score         : number
		isNewHighscore?: boolean
	}>
}


// MARK: ScoreboardLayer
/**
 * In-game scoreboard (LeftTop zone). Shows on `GAME_ACTIVE`, hides on `GAME_END`.
 * Rows come from `C_GameData.ScoreBoard`.
 */
export class ScoreboardLayer extends Layer {
	private scoreboardVersion = 0

	constructor() {
		super({
			id         : 'skyChaser-scoreboard',
			zone       : ZoneType.LeftTop,
			canBeHidden: true,
			startHidden: true,
			uiTransform: {
				// LeftTop pins content to the top of the strip; only override width.
				// Panel height comes from the in-flow wrapper in body(), not the Zone.
				// scoreboard-bg.png has ~8px transparent left padding — pull zone left to compensate.
				width : PANEL_WIDTH,
				margin: { left: -8 },
			},
		})

		this.props = new PropsController<ScoreboardProps>({
			rows: [],
		})

		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			this.applyScoreBoard({ scores: ComponentStore.getPlayerScores() })
			this.show()
		})
		eventBus.on(ClientEvents.GAME_END, () => {
			this.hide()
		})

		ComponentStore.onComponentChange(C_GameData.ScoreBoard, (data) => {
			this.applyScoreBoard(data as ScoreBoardComponentData | undefined)
		})

		this.applyScoreBoard({ scores: ComponentStore.getPlayerScores() })
	}


	// MARK: applyScoreBoard
	/**
	 * Rebuilds visible rows from the synced ScoreBoard component (score desc).
	 * Resolves display names asynchronously via `userProfileCache`.
	 */
	applyScoreBoard(data: ScoreBoardComponentData | undefined) {
		const currentVersion = ++this.scoreboardVersion
		const scores         = [...(data?.scores ?? [])].sort((a, b) => b.score - a.score)

		const rows: ScoreboardRowData[] = scores.map((s) => ({
			userId         : s.userId,
			displayName    : userProfileCache.getDisplayName(s.userId),
			score          : s.score,
			isNewHighscore : s.isNewHighscore,
		}))

		this.props!.set('rows', rows)

		for (const s of scores) {
			void userProfileCache.getUserDisplayName(s.userId).then((displayName) => {
				if (currentVersion !== this.scoreboardVersion) return

				const current = this.props!.get('rows') as ScoreboardRowData[]
				const next    = current.map((row) =>
					row.userId === s.userId
						? { ...row, displayName }
						: row
				)

				this.props!.set('rows', next)
			})
		}
	}


	// MARK: setRows
	/**
	 * Replaces the visible scoreboard rows (sorted caller-side by score desc).
	 */
	setRows(rows: ScoreboardRowData[]) {
		this.props!.set('rows', rows)
	}


	// MARK: body
	protected body() {
		const theme = getTheme()
		const rows  = this.props!.get('rows') as ScoreboardRowData[]

		// Wrapper is in-flow so LeftTop can top-align a content-sized panel.
		// Absolute chrome must paint this wrapper — not the full-height Zone.
		return (
			<Column
				key        = "scoreboard-panel"
				cols       = {12}
				spacing    = {0}
				alignItems = "stretch"
			>
				<UiEntity
					key         = "scoreboard-chrome"
					uiTransform = {{
						width         : '100%',
						height        : '100%',
						positionType  : 'absolute',
						position      : { top: 0, right: 0, bottom: 0, left: 0 },
						flexDirection : 'column',
						alignItems    : 'stretch',
						justifyContent: 'flex-start',
					}}
				>
					<UiEntity
						key         = "scoreboard-chrome-top"
						uiTransform = {{
							width     : '100%',
							height    : SCOREBOARD_BG_TOP_PX,
							flexShrink: 0,
						}}
						uiBackground = {{
							texture    : { src: SCOREBOARD_BG_SRC },
							textureMode: 'stretch',
							uvs        : SCOREBOARD_BG_UV_TOP,
							color      : Color4.White(),
						}}
					/>
					<UiEntity
						key         = "scoreboard-chrome-mid"
						uiTransform = {{
							width     : '100%',
							flexGrow  : 1,
							flexShrink: 1,
						}}
						uiBackground = {{
							texture    : { src: SCOREBOARD_BG_SRC },
							textureMode: 'stretch',
							uvs        : SCOREBOARD_BG_UV_MID,
							color      : Color4.White(),
						}}
					/>
					<UiEntity
						key         = "scoreboard-chrome-bot"
						uiTransform = {{
							width     : '100%',
							height    : SCOREBOARD_BG_BOTTOM_PX,
							flexShrink: 0,
						}}
						uiBackground = {{
							texture    : { src: SCOREBOARD_BG_SRC },
							textureMode: 'stretch',
							uvs        : SCOREBOARD_BG_UV_BOT,
							color      : Color4.White(),
						}}
					/>
				</UiEntity>
				<Column
					key        = "scoreboard-body"
					cols       = {12}
					spacing    = {0}
					padding    = {{ top: 70, right: 34, bottom: 37, left: 34 }}
					alignItems = {rows.length === 0 ? 'center' : 'stretch'}
				>
					{rows.length === 0 ? (
						<Text
							key         = "scoreboard-empty"
							value       = "No scores yet"
							fontSize    = {theme.typography.size.small}
							fontColor   = {theme.colors.light}
							textAlign   = "middle-center"
							textWrap    = "nowrap"
							uiTransform = {{
								width    : 'auto',
								alignSelf: 'center',
							}}
						/>
					) : (
						rows.map((row, index) => this.renderRow(row, index, theme.typography.size.small, theme.colors.light))
					)}
				</Column>
			</Column>
		)
	}


	// MARK: renderRow
	/**
	 * One scoreboard row: row chrome (cycling atlas strip) + rank / username / score.
	 * New all-time high scores append ` (NEW HIGH SCORE)` and a trophy icon.
	 */
	private renderRow(
		row      : ScoreboardRowData,
		index    : number,
		fontSize : number,
		fontColor: Color4,
	) {
		const rank     = index + 1
		const atlasRow = (index % SCOREBOARD_ROW_STYLE_COUNT) + 1
		const rowUvs   = scoreboardRowsAtlas.row(atlasRow)
		const nameLabel = row.isNewHighscore
			? `${row.displayName} (NEW HIGH SCORE)`
			: row.displayName

		return (
			<Column
				key        = {`scoreboard-row-${row.userId}`}
				cols       = {12}
				spacing    = {0}
				padding    = {{ top: 0, right: 10, bottom: 0, left: 10 }}
				alignItems = "stretch"
			>
				<Background
					key             = {`scoreboard-row-chrome-${row.userId}`}
					textureSrc      = {scoreboardRowsAtlas.source}
					backgroundColor = {Color4.White()}
					borderWidth     = {0}
					borderRadius    = {0}
					uiBackground    = {{
						uvs: rowUvs,
					}}
				/>
				<Row
					key            = {`scoreboard-row-cols-${row.userId}`}
					alignItems     = "center"
					justifyContent = "space-between"
					spacing        = {0}
					padding        = {{ top: 0, right: 10, bottom: 0, left: 10 }}
				>
					<Column cols={2} alignItems="flex-end" justifyContent="center">
						<Text
							value     = {String(rank)}
							fontSize  = {fontSize}
							fontColor = {fontColor}
							textAlign = "middle-right"
							textWrap  = "nowrap"
						/>
					</Column>
					<Column cols={7} alignItems="flex-start" justifyContent="center">
						<Row
							alignItems = "center"
							spacing    = {4}
						>
							<Text
								value     = {nameLabel}
								fontSize  = {fontSize}
								fontColor = {row.isNewHighscore ? HIGH_SCORE_ACCENT : fontColor}
								textAlign = "middle-left"
								textWrap  = "nowrap"
							/>
							{row.isNewHighscore ? (
								<Icon
									key       = {`scoreboard-row-trophy-${row.userId}`}
									uvs       = {atlasIconsFontAwesome.uv.trophy}
									iconColor = {HIGH_SCORE_ACCENT}
									width     = {HIGH_SCORE_ICON_SIZE}
									height    = {HIGH_SCORE_ICON_SIZE}
								/>
							) : null}
						</Row>
					</Column>
					<Column cols={3} alignItems="flex-end" justifyContent="center">
						<Text
							value     = {String(row.score)}
							fontSize  = {fontSize}
							fontColor = {fontColor}
							textAlign = "middle-right"
							textWrap  = "nowrap"
						/>
					</Column>
				</Row>
			</Column>
		)
	}
}

export const scoreboardLayer = new ScoreboardLayer()
