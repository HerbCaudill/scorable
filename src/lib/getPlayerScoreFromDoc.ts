import type { GameDoc } from './automergeTypes'
import type { BoardState, Move } from './types'
import { calculateMoveScore } from './calculateMoveScore'

/** Calculate a player's total score from all their moves in a GameDoc */
export const getPlayerScoreFromDoc = (doc: GameDoc, playerIndex: number): number => {
  let score = 0
  let boardState: BoardState = Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))

  for (const move of doc.moves) {
    // Convert TilePlacement[] to Move type
    const moveAsTiles: Move = move.tilesPlaced.map(t => ({
      row: t.row,
      col: t.col,
      tile: t.tile,
    }))

    if (move.playerIndex === playerIndex) {
      score += calculateMoveScore({ move: moveAsTiles, board: boardState })

      if (move.adjustment) {
        score += move.adjustment.deduction + move.adjustment.bonus
      }
    }

    // Update board state after each move
    for (const { row, col, tile } of move.tilesPlaced) {
      boardState[row][col] = tile
    }
  }

  return score
}
