import { TILE_DISTRIBUTION } from "./constants"
import { getPlayedTiles } from "./getPlayedTiles"
import type { Game } from "./types"

export const checkTileOveruse = (
  game: Game,
  newTiles: Array<{ tile: string }>,
): TileOveruseWarning[] => {
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
        tile: letter === " " ? "blank" : letter,
        used: totalUsed,
        available,
      })
    }
  }

  return warnings
}

/** Check if a move uses tiles that exceed available count */
export type TileOveruseWarning = {
  tile: string
  used: number
  available: number
}
