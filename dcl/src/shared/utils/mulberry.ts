export function createRng(seed: number) {

	return function random() {

		// advance internal state
		seed += 0x6D2B79F5

		let t = seed
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		t = (t ^ (t >>> 14)) >>> 0

		// convert to 0-1 float
		return t / 4294967296
	}
}
