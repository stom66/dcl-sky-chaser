import * as utils from '@dcl-sdk/utils'
import { Color4 } from '@dcl/sdk/math'
import { getPlayer } from '@dcl/sdk/players'
import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import {
	atlasIconsFontAwesome,
	Background,
	ButtonImageClose,
	Column,
	getTheme,
	Icon,
	IconNumber,
	Layer,
	PropsController,
	Row,
	Text,
	UiBox,
	ZoneType,
} from '@stom66/dcl-ui-component-kit'

import { C_GameData, ComponentStore } from 'src/shared/components/componentStore'
import { ClientEvents, eventBus } from 'src/shared/utils/eventBus'
import { userProfileCache } from 'src/shared/utils/userProfileCache'

import { resultsRowsAtlas } from 'src/client/ui/themes/skyChaser/atlases'


const RESULTS_ROW_STYLE_COUNT = 4
/** Panel width; natural height follows `results-bg.png` 2:1 art (1024×512). */
const PANEL_WIDTH          = 800
const PANEL_NATURAL_HEIGHT = PANEL_WIDTH * (512 / 1024)
const ROW_ICON_SIZE        = 24
const ROW_ICON_GAP         = 2

/**
 * Set `true` to seed / grow fake rows (bypasses live `C_GameData.ScoreBoard`).
 * Kept for layout / chrome growth testing — leave off in normal play.
 */
const DEBUG_RESULTS_ENABLED  = false
const DEBUG_ROW_INTERVAL_MS  = 1000
const DEBUG_ROW_MAX          = 20

const DEBUG_DISPLAY_NAMES = [
	'SkyRider',
	'CanyonDash',
	'BalloonAce',
	'PigeonHunter',
	'GlideKing',
	'RingRunner',
	'FuelThief',
	'CloudHopper',
	'WindSurfer',
	'JetpackJoy',
	'BarrelRoll',
	'Updraft',
	'Thermal',
	'Slipstream',
	'Vortex',
	'Nimbus',
	'Zephyr',
	'Cumulus',
	'Stratosphere',
	'ApexGlider',
]

type ScoreBoardComponentData = {
	scores?: Array<{
		userId        : string
		score         : number
		isNewHighscore?: boolean
	}>
}

/**
 * Vertical slice fractions for `results-bg.png` (1024×512).
 * top    = 0.305
 * bottom = 0.176
 *
 * Native nine-slices is unreliable here, so chrome is an explicit 3-band stack:
 * fixed top, stretching middle UV strip, fixed bottom.
 */
const RESULTS_BG_TOP_FRAC    = 0.305
const RESULTS_BG_BOTTOM_FRAC = 0.176
const RESULTS_BG_SRC         = 'assets/images/ui/results-bg.png'

/** Pixel heights for the fixed caps at the art's natural display height. */
const RESULTS_BG_TOP_PX    = PANEL_NATURAL_HEIGHT * RESULTS_BG_TOP_FRAC
const RESULTS_BG_BOTTOM_PX = PANEL_NATURAL_HEIGHT * RESULTS_BG_BOTTOM_FRAC

/** Inset from the panel's right edge for the manual close control. */
const CLOSE_BUTTON_RIGHT = 28


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

const RESULTS_BG_UV_TOP = uvBand(1 - RESULTS_BG_TOP_FRAC, 1)
const RESULTS_BG_UV_MID = uvBand(RESULTS_BG_BOTTOM_FRAC, 1 - RESULTS_BG_TOP_FRAC)
const RESULTS_BG_UV_BOT = uvBand(0, RESULTS_BG_BOTTOM_FRAC)

/** Rank / score glyphs, star, and local-player name highlight. */
const RESULTS_ACCENT = Color4.fromHexString('#D1901D')


// MARK: formatScore
/**
 * Formats a score with en-US thousands separators (e.g. `1840` → `1,840`).
 */
function formatScore(score: number): string {
	return Math.round(score).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}


export type ResultsRowData = {
	userId     : string
	displayName: string
	score      : number
}

type ResultsProps = {
	rows: ResultsRowData[]
}


// MARK: ResultsLayer
/**
 * End-of-round results panel (Default zone).
 * Shows on `GAME_END`, hides on `GAME_ACTIVE`. Starts hidden.
 * Rows come from `C_GameData.ScoreBoard`.
 * Height follows content (`auto`), capped at 95vh with overflow clipped.
 * Crown on rank 1; star on the local player's row (both may appear together).
 */
export class ResultsLayer extends Layer {
	private resultsVersion = 0
	private debugRowTimer: number | null = null

	constructor() {
		super({
			id         : 'skyChaser-results',
			zone       : ZoneType.Default,
			canBeHidden: true,
			startHidden: true,
			// Zone close is top-right only — recreate inset in body().
			uiTransform: {
				width         : PANEL_WIDTH,
				height        : 'auto',
				// Keep room for the fixed top+bottom chrome caps; otherwise
				// overflow:hidden clips the bottom of results-bg.png.
				minHeight     : RESULTS_BG_TOP_PX + RESULTS_BG_BOTTOM_PX,
				maxHeight     : '95vh',
				overflow      : 'hidden',
				justifyContent: 'flex-start',
				alignItems    : 'stretch',
			},
		})

		this.props = new PropsController<ResultsProps>({
			rows: [],
		})

		eventBus.on(ClientEvents.GAME_END, () => {
			this.applyScoreBoard({ scores: ComponentStore.getPlayerScores() })
			this.show()
		})
		eventBus.on(ClientEvents.GAME_ACTIVE, () => {
			this.hide()
		})

		ComponentStore.onComponentChange(C_GameData.ScoreBoard, (data) => {
			if (this.debugRowTimer !== null) return
			this.applyScoreBoard(data as ScoreBoardComponentData | undefined)
		})

		this.applyScoreBoard({ scores: ComponentStore.getPlayerScores() })

		// if (DEBUG_RESULTS_ENABLED) {
		// 	this.populateDebugData()
		// 	this.startDebugRowGrowth()
		// }
	}


	// MARK: applyScoreBoard
	/**
	 * Rebuilds visible rows from the synced ScoreBoard component (score desc).
	 * Resolves display names asynchronously via `userProfileCache`.
	 */
	applyScoreBoard(data: ScoreBoardComponentData | undefined) {
		const currentVersion = ++this.resultsVersion
		const scores         = [...(data?.scores ?? [])].sort((a, b) => b.score - a.score)

		const rows: ResultsRowData[] = scores.map((s) => ({
			userId     : s.userId,
			displayName: userProfileCache.getDisplayName(s.userId),
			score      : s.score,
		}))

		this.props!.set('rows', rows)

		for (const s of scores) {
			void userProfileCache.getUserDisplayName(s.userId).then((displayName) => {
				if (currentVersion !== this.resultsVersion) return

				const current = this.props!.get('rows') as ResultsRowData[]
				const next    = current.map((row) =>
					row.userId === s.userId
						? { ...row, displayName }
						: row
				)

				this.props!.set('rows', next)
			})
		}
	}


	// MARK: populateDebugData
	/**
	 * Seeds two fake rows for layout work (winner + local player).
	 * Enable via `DEBUG_RESULTS_ENABLED`.
	 */
	populateDebugData() {
		const localUserId = getPlayer()?.userId ?? 'local-debug'
		const rows: ResultsRowData[] = [
			{ userId: 'debug-1',   displayName: 'SkyRider', score: 1840 },
			{ userId: localUserId, displayName: 'You',      score: 1520 },
		]

		this.props!.set('rows', rows)
	}


	// MARK: startDebugRowGrowth
	/**
	 * Appends one debug row every second until `DEBUG_ROW_MAX` rows are reached.
	 * Stress-tests auto-height + 3-slice chrome growth. Enable via `DEBUG_RESULTS_ENABLED`.
	 */
	startDebugRowGrowth() {
		if (this.debugRowTimer !== null) return

		this.debugRowTimer = utils.timers.setInterval(() => {
			const rows = this.props!.get('rows') as ResultsRowData[]
			if (rows.length >= DEBUG_ROW_MAX) {
				if (this.debugRowTimer !== null) {
					utils.timers.clearInterval(this.debugRowTimer)
					this.debugRowTimer = null
				}
				return
			}

			const nextIndex = rows.length
			const score     = Math.max(40, 1840 - nextIndex * 90)
			const nextRow: ResultsRowData = {
				userId     : `debug-${nextIndex + 1}`,
				displayName: DEBUG_DISPLAY_NAMES[nextIndex] ?? `Pilot${nextIndex + 1}`,
				score,
			}

			this.props!.set('rows', [...rows, nextRow])
		}, DEBUG_ROW_INTERVAL_MS)
	}


	// MARK: setRows
	/**
	 * Replaces the visible results rows (sorted caller-side by score desc).
	 */
	setRows(rows: ResultsRowData[]) {
		this.props!.set('rows', rows)
	}


	// MARK: body
	protected body() {
		const theme       = getTheme()
		const rows        = this.props!.get('rows') as ResultsRowData[]
		const localUserId = getPlayer()?.userId

		return [
			<ButtonImageClose
				key         = "results-close"
				id          = "btn_close_skyChaser-results"
				callback    = {() => this.hide()}
				uiTransform = {{
					position: { top: 0, right: CLOSE_BUTTON_RIGHT },
				}}
			/>,
			// Manual vertical 3-slice — native nine-slices just stretches this asset.
			<UiEntity
				key         = "results-chrome"
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
					key         = "results-chrome-top"
					uiTransform = {{
						width     : '100%',
						height    : RESULTS_BG_TOP_PX,
						flexShrink: 0,
					}}
					uiBackground = {{
						texture    : { src: RESULTS_BG_SRC },
						textureMode: 'stretch',
						uvs        : RESULTS_BG_UV_TOP,
						color      : Color4.White(),
					}}
				/>
				<UiEntity
					key         = "results-chrome-mid"
					uiTransform = {{
						width     : '100%',
						flexGrow  : 1,
						flexShrink: 1,
					}}
					uiBackground = {{
						texture    : { src: RESULTS_BG_SRC },
						textureMode: 'stretch',
						uvs        : RESULTS_BG_UV_MID,
						color      : Color4.White(),
					}}
				/>
				<UiEntity
					key         = "results-chrome-bot"
					uiTransform = {{
						width     : '100%',
						height    : RESULTS_BG_BOTTOM_PX,
						flexShrink: 0,
					}}
					uiBackground = {{
						texture    : { src: RESULTS_BG_SRC },
						textureMode: 'stretch',
						uvs        : RESULTS_BG_UV_BOT,
						color      : Color4.White(),
					}}
				/>
			</UiEntity>,
			<Column
				key        = "results-body"
				cols       = {12}
				spacing    = {0}
				padding    = {{
					top   : RESULTS_BG_TOP_PX,
					right : 92,
					bottom: RESULTS_BG_BOTTOM_PX,
					left  : 92,
				}}
				alignItems = "stretch"
			>
				{rows.map((row, index) => this.renderRow(
					row,
					index,
					theme.typography.size.default,
					theme.colors.light,
					localUserId,
				))}
			</Column>,
		]
	}


	// MARK: renderRow
	/**
	 * One results row: row chrome + dual icon slot (crown / star) / rank / username / score.
	 * Icon slots always reserve space for two icons so layout stays stable.
	 * Rank / score / star / local name use `RESULTS_ACCENT` (`#B4822B`).
	 */
	private renderRow(
		row        : ResultsRowData,
		index      : number,
		fontSize   : number,
		fontColor  : Color4,
		localUserId: string | undefined,
	) {
		const rank      = index + 1
		const atlasRow  = (index % RESULTS_ROW_STYLE_COUNT) + 1
		const rowUvs    = resultsRowsAtlas.row(atlasRow)
		const showCrown = rank === 1
		const showStar  = !!localUserId && row.userId === localUserId

		return (
			<Column
				key        = {`results-row-${row.userId}`}
				cols       = {12}
				spacing    = {0}
				padding    = {{ top: 0, right: 8, bottom: 0, left: 8 }}
				alignItems = "stretch"
			>
				<Background
					key             = {`results-row-chrome-${row.userId}`}
					textureSrc      = {resultsRowsAtlas.source}
					backgroundColor = {Color4.White()}
					borderWidth     = {0}
					borderRadius    = {0}
					uiBackground    = {{
						uvs: rowUvs,
					}}
				/>
				<Row
					key            = {`results-row-cols-${row.userId}`}
					alignItems     = "center"
					justifyContent = "flex-start"
					spacing        = {0}
					padding        = {{ top: 0, right: 12, bottom: 0, left: 10 }}
				>
					<Column cols={2} alignItems="center" justifyContent="center">
						<Row
							alignItems     = "center"
							justifyContent = "center"
							spacing        = {ROW_ICON_GAP}
						>
							{this.renderIconSlot(
								`results-row-crown-${row.userId}`,
								showCrown ? atlasIconsFontAwesome.uv.crown : undefined,
								fontColor,
							)}
							{this.renderIconSlot(
								`results-row-star-${row.userId}`,
								showStar ? atlasIconsFontAwesome.uv.star : undefined,
								RESULTS_ACCENT,
							)}
						</Row>
					</Column>
					<Column cols={1} alignItems="flex-end" justifyContent="flex-end" padding={{ right: 32 }}>
						<IconNumber
							value     = {rank}
							height    = {ROW_ICON_SIZE}
							iconColor = {RESULTS_ACCENT}
						/>
					</Column>
					<Column cols={6} alignItems="flex-start" justifyContent="center">
						<Text
							value     = {row.displayName}
							fontSize  = {fontSize}
							fontColor = {showStar ? RESULTS_ACCENT : fontColor}
							textAlign = "middle-left"
							textWrap  = "nowrap"
						/>
					</Column>
					<Column cols={3} alignItems="flex-end" justifyContent="flex-end" padding={{ right: 22 }}>
						<IconNumber
							value     = {formatScore(row.score)}
							height    = {ROW_ICON_SIZE}
							iconColor = {RESULTS_ACCENT}
						/>
					</Column>
				</Row>
			</Column>
		)
	}


	// MARK: renderIconSlot
	/**
	 * Fixed-size icon or empty spacer so dual-icon rows never shift columns.
	 */
	private renderIconSlot(
		key      : string,
		uvs      : number[] | undefined,
		fontColor: Color4,
	) {
		if (uvs) {
			return (
				<Icon
					key       = {key}
					uvs       = {uvs}
					iconColor = {fontColor}
					width     = {ROW_ICON_SIZE}
					height    = {ROW_ICON_SIZE}
				/>
			)
		}

		return (
			<UiBox
				key    = {key}
				width  = {ROW_ICON_SIZE}
				height = {ROW_ICON_SIZE}
			/>
		)
	}
}

export const resultsLayer = new ResultsLayer()
