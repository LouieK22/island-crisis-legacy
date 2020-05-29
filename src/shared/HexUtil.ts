export function GetNearbyTileCoordinates(coordinate: Vector2int16) {
	return [
		new Vector2int16(coordinate.X + 1, coordinate.Y),
		new Vector2int16(coordinate.X - 1, coordinate.Y),

		new Vector2int16(coordinate.X, coordinate.Y + 1),
		new Vector2int16(coordinate.X, coordinate.Y - 1),

		new Vector2int16(coordinate.X + 1, coordinate.Y - 1),
		new Vector2int16(coordinate.X - 1, coordinate.Y + 1),
	];
}
