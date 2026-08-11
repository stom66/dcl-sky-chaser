// Fetches the right UVs cords to get a number from the icon atlas
// Note only 0-12 are supported
export function getUVsForIconAtlasNumber(number: number): number[] {
	var y = 0.5
	if (number >= 8) {
		y = 0
		number = number - 8
	}
	//console.log('getUVsForIconAtlasNumber: number', number)
	return [
		number * 0.125, y, 
		number * 0.125, y + 0.5, 
		(number + 1) * 0.125, y + 0.5, 
		(number + 1) * 0.125, y
	]

}


export enum AtlasLabelsRowIndex {
	FUEL             = 7,
	POINT            = 6,
	COMBO            = 5,
	START_GAME       = 4,
	ZOOM             = 3,
	GAME_STARTING    = 2,
	GAME_IN_PROGRESS = 1,
	UNKNOWN          = 0,
}

export function getUVsForIconAtlasRow(
	number : number, 
	maxRows: number = 8
): number[] {
	const ROW_HEIGHT = 1/maxRows
	
	//console.log('getUVsForIconAtlasNumber: number', number)
	return [
		0, number * ROW_HEIGHT,
		0, (number+1) * ROW_HEIGHT,
		1, (number+1) * ROW_HEIGHT,
		1, number * ROW_HEIGHT,
	]

}
