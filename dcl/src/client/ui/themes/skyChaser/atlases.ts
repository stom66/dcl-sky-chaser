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


// MARK: guiLabelsAtlas
/**
 * GUI label strips (`atlas-gui-labels.png`).
 * One column, eight rows (UV bottom → top). `startGame` matches old
 * `AtlasLabelsRowIndex.START_GAME` (0-based row 4 from bottom → UV yStart 5).
 */
export const guiLabelsAtlas = new TextureAtlas({
	source : 'assets/images/ui/atlas-gui-labels.png',
	columns: 1,
	rows   : 8,
	named  : {
		unknown        : { xStart: 1, yStart: 1 },
		gameInProgress : { xStart: 1, yStart: 2 },
		gameStarting   : { xStart: 1, yStart: 3 },
		zoom           : { xStart: 1, yStart: 4 },
		startGame      : { xStart: 1, yStart: 5 },
		combo          : { xStart: 1, yStart: 6 },
		point          : { xStart: 1, yStart: 7 },
		fuel           : { xStart: 1, yStart: 8 },
	},
})
