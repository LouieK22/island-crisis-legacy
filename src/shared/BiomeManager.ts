import { AxialCoordinates, axialKey, calculateDecayingNoise, cubeDistance, getNearbyCoordinates } from "shared/HexUtil";
import type { MapConfigImpl } from "shared/WorldBuilder";

export enum Biome {
	Water,
	Grassland,
	Coastline,
	MountainSnow,
	Mountain,
}

export class BiomeManager {
	public constructor(readonly config: MapConfigImpl, readonly rand: Random) {}

	public getTileBiome(axial: AxialCoordinates) {
		if (this.tileHasWater(axial)) {
			return Biome.Water;
		}

		if (this.tileIsCoastline(axial)) {
			return Biome.Coastline;
		}

		const height = calculateDecayingNoise(axial, this.config);
		if (height > 0.2) {
			return Biome.MountainSnow;
		} else if (height > 0) {
			return Biome.Mountain;
		}

		return Biome.Grassland;
	}

	private tileIsCoastline(axial: AxialCoordinates) {
		for (const neighbor of getNearbyCoordinates(axial, 1)) {
			if (this.tileHasWater(neighbor)) {
				return true;
			}
		}

		return false;
	}

	private tileHasWater(axial: AxialCoordinates) {
		const height = calculateDecayingNoise(axial, this.config);
		if (height <= this.config.WaterLevel) {
			return true;
		}

		return false;
	}
}
