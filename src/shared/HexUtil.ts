export interface AxialCoordinates {
	X: number;
	Z: number;
}

export interface CubeCoordinates {
	X: number;
	Y: number;
	Z: number;
}

export function GetNearbyTileCoordinates(axial: AxialCoordinates): Array<AxialCoordinates> {
	return [
		{
			X: axial.X + 1,
			Z: axial.Z,
		},
		{
			X: axial.X - 1,
			Z: axial.Z,
		},
		{
			X: axial.X,
			Z: axial.Z + 1,
		},
		{
			X: axial.X,
			Z: axial.Z - 1,
		},
		{
			X: axial.X + 1,
			Z: axial.Z - 1,
		},
		{
			X: axial.X - 1,
			Z: axial.Z + 1,
		},
	];
}

export function axialToCube(axial: AxialCoordinates): CubeCoordinates {
	return {
		X: axial.X,
		Y: -axial.X - axial.Z,
		Z: axial.Z,
	};
}

export function cubeDistance(axial: AxialCoordinates) {
	const cube = axialToCube(axial);
	return math.max(math.abs(cube.X), math.abs(cube.Y), math.abs(cube.Z));
}

export function calculateDecayingNoise(axial: AxialCoordinates, seed: number, decayCounterFactor: number) {
	let yNoise = math.noise(axial.X / 6, axial.Z / 6, seed);
	yNoise = yNoise - cubeDistance(axial) / decayCounterFactor;

	return math.max(yNoise, -0.4);
}

export function axialKey(axial: AxialCoordinates) {
	let x = axial.X;
	let z = axial.Z;

	if (x === 0) {
		x = 0;
	}

	if (z === 0) {
		z = 0;
	}

	return `${x},${z}`;
}
