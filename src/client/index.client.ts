import Timer from "shared/Timer";
import { RenderMap, BuildMapDefinition } from "shared/WorldBuilder";

const t1 = Timer("Map Generation");

const mapDef = BuildMapDefinition({
	Radius: 100,
	DepthScale: 5,
	WaterLevel: -0.4,
	TotalTowns: 50,
	Seed: 0.18867828086815,
	GenerateBiomes: false,

	Debug: {
		ShowCoords: false,
		VisualizeBiomes: true,
	},
});

t1();

const t2 = Timer("Map Render");

RenderMap(mapDef);

t2();

export {};
