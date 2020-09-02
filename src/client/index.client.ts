import { BuildTerrain, BuildMapDefinition } from "shared/WorldBuilder";

BuildTerrain(
	BuildMapDefinition({
		Radius: 25,
		DepthScale: 5,
	}),
);

export {};
