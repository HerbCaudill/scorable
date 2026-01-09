import type { BoardState, Move } from "./types"

/**
 * Convert a BoardState grid to a Move array
 * Extracts all non-null tiles from the board into position/tile format
 */
export const boardStateToMove = (newTiles: BoardState): Move => {
  const move: Move = []
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      const tile = newTiles[row][col]
      if (tile !== null) {
        move.push({ row, col, tile })
      }
    }
  }
  return move
}
