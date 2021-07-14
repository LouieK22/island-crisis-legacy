import type { MapConfigImpl, TileDefinition } from "shared/WorldBuilder";

const globalRand = new Random();

export type TileMap = Map<number, Map<number, TileDefinition>>;

export interface AxialCoordinates {
	X: number;
	Z: number;
}

export interface CubeCoordinates {
	X: number;
	Y: number;
	Z: number;
}

export function cubeAdd(cube1: CubeCoordinates, cube2: CubeCoordinates): CubeCoordinates {
	return {
		X: cube1.X + cube2.X,
		Y: cube1.Y + cube2.Y,
		Z: cube1.Z + cube2.Z,
	};
}

export function axialToCube(axial: AxialCoordinates): CubeCoordinates {
	let cubeY = -axial.X - axial.Z;
	if (cubeY === 0) {
		cubeY = 0;
	}

	return {
		X: axial.X,
		Y: cubeY,
		Z: axial.Z,
	};
}

export function cubeDistance(axial: AxialCoordinates) {
	const cube = axialToCube(axial);
	return math.max(math.abs(cube.X), math.abs(cube.Y), math.abs(cube.Z));
}

export function calculateDecayingNoise(axial: AxialCoordinates, config: MapConfigImpl) {
	const scaleFactor = (config.Radius / 25) * 1.5 + 6;

	let yNoise = math.noise(axial.X / scaleFactor, axial.Z / scaleFactor, config.Seed);
	yNoise = yNoise - cubeDistance(axial) / (config.Radius * 0.95);

	return yNoise;
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

export function getNearbyCoordinates(origin: AxialCoordinates, range: number): AxialCoordinates[] {
	const cubeOrigin = axialToCube(origin);
	const output = new Array<AxialCoordinates>();

	for (let cubeX = -range; cubeX <= range; cubeX++) {
		for (let cubeY = math.max(-range, -cubeX - range); cubeY <= math.min(range, -cubeX + range); cubeY++) {
			let cubeZ = -cubeX - cubeY;
			if (cubeZ === 0) {
				cubeZ = 0;
			}

			if (cubeX === 0 && cubeZ === 0) {
				cubeY++;
				continue;
			}

			output.push(
				cubeAdd(cubeOrigin, {
					X: cubeX,
					Y: cubeY,
					Z: cubeZ,
				}),
			);
		}
	}

	return output;
}

export type BiomeFilter =
	| {
			Include: Set<number>;
	  }
	| {
			Exclude: Set<number>;
	  };

/**
 * Get a random set of tiles in the map without duplicates.
 * Heads up, this function has terrible performance, use sparingly
 * @param map MapDefinition to read tiles from
 * @param totalResults Total number of tiles to pick
 * @param type Optional filter of tiles
 */
export function getRandomMapTiles(tiles: TileMap, totalResults: number, rand = globalRand, filter?: BiomeFilter) {
	const input = new Array<TileDefinition>();
	const output = new Array<TileDefinition>();
	const chosen = new Map<string, boolean>();

	for (const [_, zMap] of tiles) {
		for (const [_, tile] of zMap) {
			input.push(tile);
		}
	}

	for (let i = 0; i < totalResults; ) {
		if (input.size() === 0) {
			warn(`failed to get ${totalResults} random tiles, only got ${output.size()} tiles`);
			return output;
		}

		const index = rand.NextInteger(0, input.size() - 1);
		const tile = input[index];

		if (filter) {
			if ("Include" in filter) {
				if (!filter.Include.has(tile.Biome)) {
					input.remove(index);
					continue;
				}
			} else {
				if (filter.Exclude.has(tile.Biome)) {
					input.remove(index);
					continue;
				}
			}
		}

		input.remove(index);
		output.push(tile);
		chosen.set(axialKey(tile.Position), true);

		i++;
	}

	return output;
}
