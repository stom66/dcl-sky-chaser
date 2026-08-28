import { TextureAtlas } from '@stom66/dcl-ui-component-kit'


// MARK: scoreboardRowsAtlas
/**
 * In-game scoreboard row chrome (`scoreboard-rows.png`).
 * One column, four stacked styles (UV bottom → top = rows 1…4).
 */
export const scoreboardRowsAtlas = new TextureAtlas({
	source : 'assets/images/ui/scoreboard-rows.png',
	columns: 1,
	rows   : 4,
})


// MARK: resultsRowsAtlas
/**
 * End-of-round results row chrome (`results-rows.png`).
 * One column, four stacked styles (UV bottom → top = rows 1…4).
 * Left cell of each strip is reserved for an optional leading icon.
 */
export const resultsRowsAtlas = new TextureAtlas({
	source : 'assets/images/ui/results-rows.png',
	columns: 1,
	rows   : 4,
})


// MARK: btnWideAtlas
/**
 * Wide start-button chrome (`btn-wide.png`).
 * One column; four state rows UV bottom → top = blank / pressed / hover / default
 * (PNG top → bottom = default / hover / pressed / blank).
 */
export const btnWideAtlas = new TextureAtlas({
	source : 'assets/images/ui/btn-wide.png',
	columns: 1,
	rows   : 4,
})


// MARK: btnHowToPlayAtlas
/**
 * How To Play toggle chrome (`btn-howToPlay.png`).
 * One column; four state rows UV bottom → top = blank / pressed / hover / default
 * (PNG top → bottom = default / hover / pressed / blank). Each cell is 128x128.
 */
export const btnHowToPlayAtlas = new TextureAtlas({
	source : 'assets/images/ui/btn-howToPlay.png',
	columns: 1,
	rows   : 4,
})


// MARK: btnGoToStartAtlas
/**
 * How To Play toggle chrome (`btn-goToStart.png`).
 * One column; four state rows UV bottom → top = blank / pressed / hover / default
 * (PNG top → bottom = default / hover / pressed / blank). Each cell is 128x128.
 */
export const btnGoToStartAtlas = new TextureAtlas({
	source : 'assets/images/ui/btn-goToStart.png',
	columns: 1,
	rows   : 4,
})


// MARK: guiLabelsAtlas
/**
 * GUI label strips (`atlas-gui-labels.png`).
 * One column, eight rows (UV bottom → top). PNG top → bottom:
 * fuel / point / combo / startGame / zoom / gameStarting / gameInProgress / exitSpectate.
 */
export const guiLabelsAtlas = new TextureAtlas({
	source : 'assets/images/ui/atlas-gui-labels.png',
	columns: 1,
	rows   : 8,
	named  : {
		exitSpectate   : { xStart: 1, yStart: 1 },
		gameInProgress : { xStart: 1, yStart: 2 },
		gameStarting   : { xStart: 1, yStart: 3 },
		zoom           : { xStart: 1, yStart: 4 },
		startGame      : { xStart: 1, yStart: 5 },
		combo          : { xStart: 1, yStart: 6 },
		point          : { xStart: 1, yStart: 7 },
		fuel           : { xStart: 1, yStart: 8 },
	},
})


// MARK: progressFillAtlas
/**
 * Round-timer fill (`progress-fill.png`). Single full-frame cell for
 * `ProgressBarImage` + `uvCropWithFill` (reveal, not stretch).
 */
export const progressFillAtlas = new TextureAtlas({
	source : 'assets/images/ui/progress-fill.png',
	columns: 1,
	rows   : 1,
})


// MARK: fuelFillAtlas
/**
 * Fuel-gauge fill (`fuel-fill.png`). Single full-frame cell for
 * `ProgressBarImage` + `uvCropWithFill` (reveal, not stretch).
 */
export const fuelFillAtlas = new TextureAtlas({
	source : 'assets/images/ui/fuel-fill.png',
	columns: 1,
	rows   : 1,
})


// MARK: charsNumbersAtlas
/**
 * SkyChaser number / operator atlas (`atlas-chars-numbers.png`).
 * Same 4×4 layout as the kit default; project art under `assets/images/ui/`.
 *
 * Grid (PNG top → bottom):
 *   / + - ×
 *   8 9 , :
 *   4 5 6 7
 *   0 1 2 3
 */
export const charsNumbersAtlas = new TextureAtlas({
	source : 'assets/images/ui/atlas-chars-numbers.png',
	columns: 4,
	rows   : 4,
	layout : [
		"/+-×",
		"89,:",
		"4567",
		"0123",
	],
	aliases: {
		'*': '×',
		'x': '×',
	},
	charInsets: {
		'1': { insetX: 0.3  },
		',': { insetX: 0.35 },
		':': { insetX: 0.35 },
	},
})


// MARK: toastPickupAtlas
/**
 * In-match pickup toast chrome (`toast-pickup.png`).
 * One column, four rows (UV bottom → top). PNG top → bottom:
 * strike / score / combo / fuel.
 *
 * Stubbed until the PNG is exported into `assets/images/ui/`.
 */
export const toastPickupAtlas = new TextureAtlas({
	source : 'assets/images/ui/toast-pickups.png',
	columns: 1,
	rows   : 4,
	named  : {
		score : { xStart: 1, yStart: 4 },
		combo : { xStart: 1, yStart: 3 },
		fuel  : { xStart: 1, yStart: 2 },
		strike: { xStart: 1, yStart: 1 },
	},
})


// MARK: hintsAtlas
/**
 * Tutorial hint strips (`atlas-hints.png`, 1024×2048).
 * One column, ten rows (UV bottom → top = rows 1…10). Matches old `ui.hints`.
 */
export const hintsAtlas = new TextureAtlas({
	source : 'assets/images/ui/atlas-hints.png',
	columns: 1,
	rows   : 10,
})
