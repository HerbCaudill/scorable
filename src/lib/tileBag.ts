import type { Game } from './types'

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
  ' ': 2, // Blank tiles
}

/** Total number of tiles in a standard Scrabble game */
export const TOTAL_TILES = Object.values(TILE_DISTRIBUTION).reduce((sum, count) => sum + count, 0)

/** Count tiles that have been played in the game */
export const getPlayedTiles = (game: Game): Record<string, number> => {
  const played: Record<string, number> = {}

  for (const move of game.moves) {
    for (const { tile } of move.tilesPlaced) {
      const letter = tile.toUpperCase()
      played[letter] = (played[letter] || 0) + 1
    }
  }

  return played
}

/** Get remaining tiles in the bag */
export const getRemainingTiles = (game: Game): Record<string, number> => {
  const played = getPlayedTiles(game)
  const remaining: Record<string, number> = {}

  for (const [letter, total] of Object.entries(TILE_DISTRIBUTION)) {
    const playedCount = played[letter] || 0
    const remainingCount = total - playedCount
    if (remainingCount > 0) {
      remaining[letter] = remainingCount
    }
  }

  return remaining
}

/** Get total count of remaining tiles */
export const getRemainingTileCount = (game: Game): number => {
  const remaining = getRemainingTiles(game)
  return Object.values(remaining).reduce((sum, count) => sum + count, 0)
}

/** Get tiles sorted alphabetically with blanks at the end */
export const getSortedTileEntries = (tiles: Record<string, number>): Array<[string, number]> => {
  return Object.entries(tiles).sort(([a], [b]) => {
    // Blanks go last
    if (a === ' ') return 1
    if (b === ' ') return -1
    return a.localeCompare(b)
  })
}

/** Check if a move uses tiles that exceed available count */
export type TileOveruseWarning = {
  tile: string
  used: number
  available: number
}

export const checkTileOveruse = (game: Game, newTiles: Array<{ tile: string }>): TileOveruseWarning[] => {
  const played = getPlayedTiles(game)
  const warnings: TileOveruseWarning[] = []

  // Count tiles in the new move
  const moveTiles: Record<string, number> = {}
  for (const { tile } of newTiles) {
    const letter = tile.toUpperCase()
    moveTiles[letter] = (moveTiles[letter] || 0) + 1
  }

  // Check each tile type in the move
  for (const [letter, moveCount] of Object.entries(moveTiles)) {
    const alreadyPlayed = played[letter] || 0
    const totalUsed = alreadyPlayed + moveCount
    const available = TILE_DISTRIBUTION[letter] || 0

    if (totalUsed > available) {
      warnings.push({
        tile: letter === ' ' ? 'blank' : letter,
        used: totalUsed,
        available,
      })
    }
  }

  return warnings
}
