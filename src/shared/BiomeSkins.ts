interface BiomeSkin {
	Color: Color3;
	Material: Enum.Material;
}

interface BiomeSkins {
	[index: number]: BiomeSkin | undefined;
}

const BiomeSkins: BiomeSkins = {
	// Water
	[0]: {
		Material: Enum.Material.Plastic,
		Color: Color3.fromRGB(51, 88, 130),
	},

	// Grassland
	[1]: {
		Material: Enum.Material.Grass,
		Color: Color3.fromRGB(39, 70, 45),
	},

	// Coastline
	[2]: {
		Material: Enum.Material.Slate,
		Color: Color3.fromRGB(255, 0, 0),
	},

	// Desert
	[3]: {
		Material: Enum.Material.Sand,
		Color: Color3.fromRGB(248, 217, 109),
	},

	// Tundra
	[4]: {
		Material: Enum.Material.Sand,
		Color: Color3.fromRGB(242, 243, 243),
	},

	// Forest:
	[5]: {
		Material: Enum.Material.Slate,
		Color: Color3.fromRGB(161, 196, 140),
	},
};

export = BiomeSkins;
