import type { BoardState, Move } from './types'

/**
 * Calculate the total score for a move, including bingo bonus
 */
export const calculateMoveScore = ({ move, board }: { move: Move; board: BoardState }): number => {
  console.log(move, board)
  return 0
}

export const BINGO_BONUS = 50
