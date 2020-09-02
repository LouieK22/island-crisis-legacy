import { Workspace, ReplicatedStorage } from "@rbxts/services";
import { calculateDecayingNoise, GetNearbyTileCoordinates } from "shared/HexUtil";

export enum TileType {
	Empty,
	Water,
	Lava,
}

export interface TileDefinition {
	Position: Vector2int16;
	Type: TileType;
}

export interface MapDefinition {
	Seed: number;
	Tiles: Map<number, Map<number, TileDefinition>>;
	Radius: number;
	DepthScale: number;
}

export function BuildMapDefinition(radius: number, depth: number, seed?: number): MapDefinition {
	const tiles: Map<number, Map<number, TileDefinition>> = new Map();
	if (seed === undefined) {
		seed = math.random();
	}

	// Create initial map
	for (let cubeX = -radius; cubeX <= radius; cubeX++) {
		for (let cubeY = math.max(-radius, -cubeX - radius); cubeY <= math.min(radius, -cubeX + radius); cubeY++) {
			const cubeZ = -cubeX - cubeY;

			let zMap = tiles.get(cubeX);
			if (!zMap) {
				tiles.set(cubeX, new Map());
				zMap = tiles.get(cubeX);
			}

			if (zMap) {
				let tileType = TileType.Empty;
				const yNoise = calculateDecayingNoise(cubeX, cubeZ, seed, radius);

				if (yNoise <= -0.4) {
					tileType = TileType.Water;
				}

				zMap.set(cubeZ, {
					Position: new Vector2int16(cubeX, cubeZ),
					Type: tileType,
				});
			}
		}
	}

	// Flood-fill to determine which tiles make up the central island
	const visited: Map<string, boolean> = new Map();
	const toVisit: Array<Vector2int16> = [new Vector2int16(0, 0)];
	visited.set("0,0", true);

	let visitIdx = 0;
	for (;;) {
		const tile = toVisit[visitIdx];

		if (tile) {
			for (const neighbor of GetNearbyTileCoordinates(tile)) {
				const neighborKey = `${neighbor.X},${neighbor.Y}`;

				if (!visited.has(neighborKey)) {
					const yNoise = calculateDecayingNoise(neighbor.X, neighbor.Y, seed, radius);

					if (yNoise <= -0.4) {
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
				const visitGood = visited.get(`${tile.Position.X},${tile.Position.Y}`);

				if (!visitGood) {
					tile.Type = TileType.Water;
				}
			}
		}
	}

	return {
		Tiles: tiles,
		Seed: seed,
		Radius: radius,
		DepthScale: depth,
	};
}

export function BuildTerrain(mapDef: MapDefinition) {
	let worldMap = Workspace.FindFirstChild("WorldMap") as Folder | undefined;
	if (!worldMap) {
		worldMap = new Instance("Folder");
		worldMap.Name = "WorldMap";
		worldMap.Parent = Workspace;
	}

	worldMap.ClearAllChildren();

	const outerRadius = 5;
	const innerRadius = outerRadius * (math.sqrt(3) / 2);

	for (const [_, rowDef] of mapDef.Tiles) {
		for (const [_, tileDef] of rowDef) {
			const x = tileDef.Position.X;
			const z = tileDef.Position.Y;

			let yNoise = calculateDecayingNoise(x, z, mapDef.Seed, mapDef.Radius);
			if (tileDef.Type === TileType.Water) {
				// || tileDef.Type === TileType.Lava) {
				yNoise = -0.4;
			}

			const newTile = ReplicatedStorage.Tile.Clone();
			newTile.Size = new Vector3(newTile.Size.X, mapDef.DepthScale * 2, newTile.Size.Z);
			newTile.Position = new Vector3(
				(x + z * 0.5) * (innerRadius * 2),
				yNoise * mapDef.DepthScale,
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
				case TileType.Lava:
					newTile.Material = Enum.Material.Slate;
					newTile.Color = new Color3(1, 0, 0);

					break;
				default:
					break;
			}

			// Naming
			const surfaceGui = new Instance("SurfaceGui");
			surfaceGui.Face = Enum.NormalId.Top;
			surfaceGui.Parent = newTile;

			const textLabel = new Instance("TextLabel");
			textLabel.Text = `${tileDef.Position.X}\n${tileDef.Position.Y}`;
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
