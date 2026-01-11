import { tileValues } from "./tileValues"
import { isBlankTile } from "./isBlankTile"

export const getTileValue = (letter: string): number => {
  // Blank tiles (space or lowercase) have 0 value
  if (isBlankTile(letter)) return 0
  return tileValues[letter.toUpperCase()] ?? 0
}
