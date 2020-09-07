import { ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { Biome, BiomeManager } from "shared/BiomeManager";
import BiomeSkins from "shared/BiomeSkins";
import {
	AxialCoordinates,
	axialKey,
	calculateDecayingNoise,
	getNearbyCoordinates,
	getRandomMapTiles,
	TileMap,
} from "shared/HexUtil";

export interface TileDefinition {
	Position: AxialCoordinates;

	HasTown: boolean;

	Biome: Biome;
}

export interface MapConfig {
	Radius: number;
	DepthScale: number;
	TotalTowns: number;
	WaterLevel?: number;
	Seed?: number;
	Archipelago?: boolean;

	Debug?: {
		ShowCoords?: boolean;
		VisualizeBiomes?: boolean;
	};
}

export type MapConfigImpl = Required<Omit<MapConfig, "Debug">> & Pick<MapConfig, "Debug">;

export interface MapDefinition {
	Config: MapConfigImpl;

	/**
	 * 2D Map of every tile
	 */
	Tiles: TileMap;
}

export function BuildMapDefinition(config: MapConfig): MapDefinition {
	if (config.WaterLevel === undefined) {
		config.WaterLevel = -0.4;
	}

	if (config.Seed === undefined) {
		for (;;) {
			config.Seed = math.random();

			const rand = new Random(config.Seed);
			const biomeManager = new BiomeManager(config as MapConfigImpl, rand);

			const biome = biomeManager.getTileBiome({ X: 0, Z: 0 });

			if (biome === Biome.MountainSnow) {
				break;
			}
		}
	}
	print(`Seed: ${config.Seed}`);

	const tiles: Map<number, Map<number, TileDefinition>> = new Map();
	const rand = new Random(config.Seed);
	const biomeManager = new BiomeManager(config as MapConfigImpl, rand);

	/*
		Terrain Generation
	*/

	// Create initial map
	for (let cubeX = -config.Radius; cubeX <= config.Radius; cubeX++) {
		for (
			let cubeY = math.max(-config.Radius, -cubeX - config.Radius);
			cubeY <= math.min(config.Radius, -cubeX + config.Radius);
			cubeY++
		) {
			let cubeZ = -cubeX - cubeY;
			if (cubeZ === 0) {
				cubeZ = 0;
			}

			let zMap = tiles.get(cubeX);
			if (!zMap) {
				tiles.set(cubeX, new Map());
				zMap = tiles.get(cubeX);
			}

			if (zMap) {
				const axial = {
					X: cubeX,
					Z: cubeZ,
				};

				const biome = biomeManager.getTileBiome(axial);

				zMap.set(cubeZ, {
					Position: axial,
					HasTown: false,
					Biome: biome,
				});
			}
		}
	}

	// Cull outliers if Archipelago is disabled
	if (!config.Archipelago) {
		// Flood-fill to determine which tiles make up the central island
		const visited = new Map<string, boolean>();
		const toVisit: Array<AxialCoordinates> = [{ X: 0, Z: 0 }];
		visited.set("0,0", true);

		let visitIdx = 0;
		for (;;) {
			const tile = toVisit[visitIdx];

			if (tile) {
				for (const neighbor of getNearbyCoordinates(tile, 1)) {
					const neighborKey = axialKey(neighbor);

					if (!visited.has(neighborKey)) {
						const height = calculateDecayingNoise(neighbor, config as MapConfigImpl);

						if (height <= config.WaterLevel) {
							visited.set(neighborKey, false);
						} else {
							visited.set(neighborKey, true);
							toVisit.push(neighbor);
						}
					}
				}

				visitIdx++;
			} else {
				break;
			}
		}

		// Remove land tiles not on the central island
		for (const [_, zMap] of tiles) {
			for (const [_, tile] of zMap) {
				if (tile.Biome !== Biome.Water) {
					const visitGood = visited.get(axialKey(tile.Position));

					if (!visitGood) {
						tile.Biome = Biome.Water;
					}
				}
			}
		}
	}

	/*
		Structure Generation
	*/

	// Place Towns
	let townExclusionZoneRadius = math.min(config.Radius, 10);
	let townExclusionZoneRetries = 0;

	const biomeIncludes = new Set([Biome.Coastline, Biome.Grassland]);

	for (let townsGenerated = 0; townsGenerated < config.TotalTowns; ) {
		const townSeeds = getRandomMapTiles(tiles, config.TotalTowns - townsGenerated, rand, {
			Include: biomeIncludes,
		});

		let newTownThisIteration = false;
		for (const tile of townSeeds) {
			const neighborCoords = getNearbyCoordinates(tile.Position, townExclusionZoneRadius);
			let canBeTown = true;

			for (const coord of neighborCoords) {
				const zMap = tiles.get(coord.X);
				if (!zMap) {
					continue;
				}

				const neighborTile = zMap.get(coord.Z);
				if (!neighborTile) {
					continue;
				}

				if (neighborTile.HasTown) {
					canBeTown = false;
					break;
				}

				if (tile.HasTown) {
					canBeTown = false;
					break;
				}
			}

			const waterCheckNeighbors = getNearbyCoordinates(tile.Position, 1);

			let landNearby = false;
			for (const coord of waterCheckNeighbors) {
				const zMap = tiles.get(coord.X);
				if (!zMap) {
					continue;
				}

				const neighborTile = zMap.get(coord.Z);
				if (!neighborTile) {
					continue;
				}

				if (neighborTile.Biome !== Biome.Water) {
					landNearby = true;
					break;
				}
			}

			if (canBeTown && landNearby) {
				tile.HasTown = true;
				townsGenerated++;
				newTownThisIteration = true;
			}
		}

		if (!newTownThisIteration) {
			townExclusionZoneRetries++;
		}

		if (townExclusionZoneRetries === 3) {
			townExclusionZoneRadius--;
			townExclusionZoneRetries = 0;
		}

		if (townExclusionZoneRadius === -1) {
			warn(`failed to place ${config.TotalTowns} towns, only placed ${townsGenerated} towns`);
			break;
		}

		print(`towns: ${townsGenerated} / ${config.TotalTowns}`);
		RunService.Heartbeat.Wait();
	}

	return {
		Config: config as MapConfigImpl,
		Tiles: tiles,
	};
}

export function RenderMap(mapDef: MapDefinition) {
	let worldMap = Workspace.FindFirstChild("WorldMap") as Folder | undefined;
	if (!worldMap) {
		worldMap = new Instance("Folder");
		worldMap.Name = "WorldMap";
		worldMap.Parent = Workspace;
	}

	worldMap.ClearAllChildren();

	const outerRadius = ReplicatedStorage.Tile.Size.Z / 2;
	const innerRadius = outerRadius * (math.sqrt(3) / 2);

	for (const [_, rowDef] of mapDef.Tiles) {
		for (const [_, tileDef] of rowDef) {
			const x = tileDef.Position.X;
			const z = tileDef.Position.Z;

			let height = calculateDecayingNoise(tileDef.Position, mapDef.Config);
			if (tileDef.Biome === Biome.Water) {
				height = mapDef.Config.WaterLevel;
			}

			const newTile = ReplicatedStorage.Tile.Clone();
			newTile.Size = new Vector3(newTile.Size.X, mapDef.Config.DepthScale * 2, newTile.Size.Z);
			newTile.Position = new Vector3(
				(x + z * 0.5) * (innerRadius * 2),
				height * mapDef.Config.DepthScale,
				z * outerRadius * 1.5,
			);

			// Biome Styling
			const skin = BiomeSkins[tileDef.Biome];
			if (skin) {
				newTile.Material = skin.Material;
				newTile.Color = skin.Color;
			} else {
				warn(`no biome skin for ${Biome[tileDef.Biome]}`);
			}

			// Town Render
			if (tileDef.HasTown) {
				newTile.Material = Enum.Material.Neon;
				newTile.Color = Color3.fromRGB(255, 255, 0);
			}

			// Debug Coords
			if (mapDef.Config.Debug?.ShowCoords) {
				const surfaceGui = new Instance("SurfaceGui");
				surfaceGui.Face = Enum.NormalId.Top;
				surfaceGui.Parent = newTile;

				const textLabel = new Instance("TextLabel");
				textLabel.Text = `${tileDef.Position.X}\n${tileDef.Position.Z}`;
				textLabel.Size = new UDim2(1, 0, 1, 0);
				textLabel.BackgroundTransparency = 1;
				textLabel.TextSize = 200;
				textLabel.Rotation = 90;
				textLabel.TextColor3 = new Color3(1, 1, 1);
				textLabel.Parent = surfaceGui;
			}

			newTile.Parent = worldMap;
		}

		RunService.Heartbeat.Wait();
	}
}
