import { TILE_DISTRIBUTION } from "./constants"
import { getPlayedTiles } from "./getPlayedTiles"
import type { Game } from "./types"

/** Get remaining unplayed tiles */

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
