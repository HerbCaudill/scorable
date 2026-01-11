import { isBlankTile } from "./isBlankTile"
import type { Game } from "./types"

/** Count tiles that have been played in the game */

export const getPlayedTiles = (game: Game): Record<string, number> => {
  const played: Record<string, number> = {}

  for (const move of game.moves) {
    for (const { tile } of move.tilesPlaced) {
      // Blank tiles (lowercase or space) are counted as blanks, not as the letter they represent
      const key = isBlankTile(tile) ? " " : tile.toUpperCase()
      played[key] = (played[key] || 0) + 1
    }
  }

  return played
}
