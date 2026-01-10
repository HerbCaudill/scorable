/** Standard Scrabble tile distribution (100 tiles total) */

export const TILE_DISTRIBUTION: Record<string, number> = {
  A: 9,
  B: 2,
  C: 2,
  D: 4,
  E: 12,
  F: 2,
  G: 3,
  H: 2,
  I: 9,
  J: 1,
  K: 1,
  L: 4,
  M: 2,
  N: 6,
  O: 8,
  P: 2,
  Q: 1,
  R: 6,
  S: 4,
  T: 6,
  U: 4,
  V: 2,
  W: 2,
  X: 1,
  Y: 2,
  Z: 1,
  " ": 2, // Blank tiles
}
/** Total number of tiles in a standard Scrabble game */
export const TOTAL_TILES = Object.values(TILE_DISTRIBUTION).reduce((sum, count) => sum + count, 0)

/** Maximum number of tiles a player can place in a single move (rack size) */
export const MAX_TILES_PER_MOVE = 7
