import { Workspace, ReplicatedStorage } from "@rbxts/services";
import { AxialCoordinates, axialKey, calculateDecayingNoise, GetNearbyTileCoordinates } from "shared/HexUtil";

export enum TileType {
	Empty,
	Water,
	Stone,
}

export interface TileDefinition {
	Position: AxialCoordinates;

	Type: TileType;
}

export interface MapConfig {
	Radius: number;
	DepthScale: number;
	WaterLevel?: number;
	Seed?: number;
}

export interface MapDefinition {
	Config: Required<MapConfig>;

	/**
	 * 2D Map of every tile
	 */
	Tiles: Map<number, Map<number, TileDefinition>>;
}

export function BuildMapDefinition(config: MapConfig): MapDefinition {
	const tiles: Map<number, Map<number, TileDefinition>> = new Map();
	if (config.Seed === undefined) {
		config.Seed = math.random();
	}
	print(`Seed: ${config.Seed}`);

	if (config.WaterLevel === undefined) {
		config.WaterLevel = -0.4;
	}

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
			const cubeZ = -cubeX - cubeY;

			let zMap = tiles.get(cubeX);
			if (!zMap) {
				tiles.set(cubeX, new Map());
				zMap = tiles.get(cubeX);
			}

			if (zMap) {
				let tileType = TileType.Empty;
				const axial = {
					X: cubeX,
					Z: cubeZ,
				};

				const height = calculateDecayingNoise(axial, config.Seed, config.Radius);

				if (height <= config.WaterLevel) {
					tileType = TileType.Water;
				}

				zMap.set(cubeZ, {
					Position: axial,
					Type: tileType,
				});
			}
		}
	}

	// Flood-fill to determine which tiles make up the central island
	const visited: Map<string, boolean> = new Map();
	const toVisit: Array<AxialCoordinates> = [{ X: 0, Z: 0 }];
	visited.set("0,0", true);

	let visitIdx = 0;
	for (;;) {
		const tile = toVisit[visitIdx];

		if (tile) {
			for (const neighbor of GetNearbyTileCoordinates(tile)) {
				const neighborKey = axialKey(neighbor);

				if (!visited.has(neighborKey)) {
					const height = calculateDecayingNoise(neighbor, config.Seed, config.Radius);

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
			if (tile.Type === TileType.Empty) {
				const visitGood = visited.get(axialKey(tile.Position));

				if (!visitGood) {
					tile.Type = TileType.Water;
				}
			}
		}
	}

	return {
		Config: config as Required<MapConfig>,
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

			let height = calculateDecayingNoise(tileDef.Position, mapDef.Config.Seed, mapDef.Config.Radius);
			if (tileDef.Type === TileType.Water) {
				height = mapDef.Config.WaterLevel;
			}

			const newTile = ReplicatedStorage.Tile.Clone();
			newTile.Size = new Vector3(newTile.Size.X, mapDef.Config.DepthScale * 2, newTile.Size.Z);
			newTile.Position = new Vector3(
				(x + z * 0.5) * (innerRadius * 2),
				height * mapDef.Config.DepthScale,
				z * outerRadius * 1.5,
			);

			// Global Styling
			newTile.Material = Enum.Material.Grass;
			newTile.Color = Color3.fromRGB(39, 70, 45);

			// Type Styling
			switch (tileDef.Type) {
				case TileType.Water:
					newTile.Material = Enum.Material.Plastic;
					newTile.Color = Color3.fromRGB(51, 88, 130);

					break;
				case TileType.Stone:
					newTile.Material = Enum.Material.Slate;
					newTile.Color = Color3.fromRGB(91, 93, 105);

					break;
				default:
					break;
			}

			// Naming
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

			newTile.Parent = worldMap;
		}
	}
}
