import { createEmptyBoard, type GameMove } from './types'
import { getWordsFromMove } from './getWordsFromMove'
import { calculateMoveScore } from './calculateMoveScore'

export type MoveHistoryEntry = {
  words: string[]
  score: number
  tiles: Array<{ row: number; col: number }>
  isAdjustment?: boolean
  adjustmentDetails?: {
    rackTiles: string[]
    deduction: number
    bonus: number
  }
}

type Options = {
  /** If true, returns most recent move first. Default: false (chronological order) */
  newestFirst?: boolean
}

export const getPlayerMoveHistory = (
  moves: GameMove[],
  playerIndex: number,
  options: Options = {}
): MoveHistoryEntry[] => {
  const { newestFirst = false } = options
  let boardState = createEmptyBoard()
  const history: MoveHistoryEntry[] = []

  for (const move of moves) {
    if (move.playerIndex === playerIndex) {
      // Check if this is an adjustment move
      if (move.adjustment) {
        const netScore = move.adjustment.deduction + move.adjustment.bonus
        history.push({
          words: [],
          score: netScore,
          tiles: [],
          isAdjustment: true,
          adjustmentDetails: move.adjustment,
        })
      } else {
        const words = getWordsFromMove(move.tilesPlaced, boardState)
        const score = calculateMoveScore({ move: move.tilesPlaced, board: boardState })
        const tiles = move.tilesPlaced.map(({ row, col }) => ({ row, col }))
        history.push({ words, score, tiles })
      }
    }
    // Update board state after each move
    for (const { row, col, tile } of move.tilesPlaced) {
      boardState[row][col] = tile
    }
  }

  return newestFirst ? history.reverse() : history
}
