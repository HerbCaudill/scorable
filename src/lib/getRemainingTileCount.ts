import { getRemainingTiles } from './getRemainingTiles'
import type { Game } from './types'

/** Get total count of remaining tiles */

export const getRemainingTileCount = (game: Game): number => {
  const remaining = getRemainingTiles(game)
  return Object.values(remaining).reduce((sum, count) => sum + count, 0)
}
