import { RunService } from "@rbxts/services";
import { AxialCoordinates, axialKey, calculateDecayingNoise, cubeDistance, getNearbyCoordinates } from "shared/HexUtil";
import type { MapConfigImpl } from "shared/WorldBuilder";

export enum TileType {
	Land,
	Water,
	Town,
}

export class BiomeManager {
	private biomeCache = new Map<string, BrickColor>();

	public constructor(readonly config: MapConfigImpl) {}

	public getTileBiome(axial: AxialCoordinates): BrickColor | undefined {
		if (!this.tileHasBiome(axial)) {
			return undefined;
		}

		const cachedBiome = this.biomeCache.get(axialKey(axial));
		if (cachedBiome) {
			return cachedBiome;
		}

		const newBiome = this.createBiomeFromSeed(axial);

		return newBiome;
	}

	private tileHasBiome(axial: AxialCoordinates) {
		const height = calculateDecayingNoise(axial, this.config.Seed, this.config.Radius);
		if (height <= this.config.WaterLevel) {
			return false;
		}

		const biomeScore = math.noise(axial.X / 4, axial.Z / 4, this.config.Seed * 5) / 2 + 1;
		if (biomeScore < 0.95) {
			return true;
		}

		return false;
	}

	private createBiomeFromSeed(seed: AxialCoordinates): BrickColor {
		const newBiome = BrickColor.random();

		const biomeTiles = new Set<AxialCoordinates>();

		const visited = new Set<string>();
		const willVisit = new Set<string>();

		const toVisit: Array<AxialCoordinates> = [seed];

		let visitIndex = 0;
		for (;;) {
			const tile = toVisit[visitIndex];

			if (!tile) {
				break;
			}

			if (visited.has(axialKey(tile))) {
				visitIndex++;
				continue;
			}

			visited.add(axialKey(tile));

			if (this.tileHasBiome(tile)) {
				biomeTiles.add(tile);

				getNearbyCoordinates(tile, 1).forEach((neighbor) => {
					if (!willVisit.has(axialKey(neighbor)) && cubeDistance(neighbor) <= this.config.Radius) {
						toVisit.push(neighbor);
						willVisit.add(axialKey(neighbor));
					}
				});
			}

			visitIndex++;
		}

		biomeTiles.forEach((tile) => {
			this.biomeCache.set(axialKey(tile), newBiome);
		});

		return newBiome;
	}
}
