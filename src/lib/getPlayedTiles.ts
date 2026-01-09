import type { Game } from "./types"

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
