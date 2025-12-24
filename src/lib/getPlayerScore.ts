import type { Game } from './types'
import { createEmptyBoard } from './types'
import { calculateMoveScore } from './calculateMoveScore'

/** Calculate a player's total score from all their moves */
export const getPlayerScore = (game: Game, playerIndex: number): number => {
  let score = 0
  let boardState = createEmptyBoard()

  for (const move of game.moves) {
    if (move.playerIndex === playerIndex) {
      // Add regular move score
      score += calculateMoveScore({ move: move.tilesPlaced, board: boardState })

      // Add end-game adjustment if present
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
