import type { GameDoc } from "./automergeTypes"
import type { BoardState, Move } from "./types"
import { calculateMoveScore } from "./calculateMoveScore"

/** Get all move scores for a specific player from a GameDoc */
export const getMoveScoresFromDoc = (doc: GameDoc, playerIndex: number): number[] => {
  const scores: number[] = []
  let boardState: BoardState = Array.from({ length: 15 }, () =>
    Array.from({ length: 15 }, () => null),
  )

  for (const move of doc.moves) {
    // Convert TilePlacement[] to Move type
    const moveAsTiles: Move = move.tilesPlaced.map(t => ({
      row: t.row,
      col: t.col,
      tile: t.tile,
    }))

    if (move.playerIndex === playerIndex) {
      // Only include actual moves (not pass moves or adjustments)
      if (moveAsTiles.length > 0) {
        const score = calculateMoveScore({ move: moveAsTiles, board: boardState })
        scores.push(score)
      }
    }

    // Update board state after each move
    for (const { row, col, tile } of move.tilesPlaced) {
      boardState[row][col] = tile
    }
  }

  return scores
}
