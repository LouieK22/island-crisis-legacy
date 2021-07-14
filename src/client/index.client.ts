import Timer from "shared/Timer";
import { RenderMap, BuildMapDefinition } from "shared/WorldBuilder";

const t1 = Timer("Map Generation");

const mapDef = BuildMapDefinition({
	Radius: 5,
	DepthScale: 8,
	WaterLevel: -0.5,
	TotalTowns: 40,
	Archipelago: false,

	Debug: {
		ShowCoords: false,
	},
});

t1();

const t2 = Timer("Map Render");

RenderMap(mapDef);

t2();

export {};
