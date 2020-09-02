export function GetNearbyTileCoordinates(coordinate: Vector2int16) {
	return [
		new Vector2int16(coordinate.X + 1, coordinate.Y),
		new Vector2int16(coordinate.X - 1, coordinate.Y),

		new Vector2int16(coordinate.X, coordinate.Y + 1),
		new Vector2int16(coordinate.X, coordinate.Y - 1),

		new Vector2int16(coordinate.X + 1, coordinate.Y - 1),
		new Vector2int16(coordinate.X - 1, coordinate.Y + 1),
	];
}

export function axialToCube(x: number, z: number) {
	return [x, -x - z, z];
}

export function cubeDistance(x: number, z: number) {
	const [cubeX, cubeY, cubeZ] = axialToCube(x, z);
	return math.max(math.abs(cubeX), math.abs(cubeY), math.abs(cubeZ));
}

export function calculateDecayingNoise(x: number, z: number, seed: number, decayCounterFactor: number) {
	let yNoise = math.noise(x / 6, z / 6, seed);
	yNoise = yNoise - cubeDistance(x, z) / decayCounterFactor;

	return math.max(yNoise, -0.4);
}
