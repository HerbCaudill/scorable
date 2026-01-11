import { createEmptyBoard, type GameMove } from "./types"
import { getWordsWithBlankInfo, type WordWithBlankInfo } from "./getWordsFromMove"
import { calculateMoveScore } from "./calculateMoveScore"

export type MoveHistoryEntry = {
  words: string[]
  wordsWithBlanks?: WordWithBlankInfo[]
  score: number
  tiles: Array<{ row: number; col: number }>
  isAdjustment?: boolean
  adjustmentDetails?: {
    rackTiles: string[]
    deduction: number
    bonus: number
  }
  isFailedChallenge?: boolean
  failedChallengeWords?: string[]
  isSuccessfulChallenge?: boolean
  successfulChallengeWords?: string[]
}

type Options = {
  /** If true, returns most recent move first. Default: false (chronological order) */
  newestFirst?: boolean
}

export const getPlayerMoveHistory = (
  moves: GameMove[],
  playerIndex: number,
  options: Options = {},
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
      } else if (move.failedChallenge) {
        // Failed challenge - pass with challenged words recorded
        history.push({
          words: [],
          score: 0,
          tiles: [],
          isFailedChallenge: true,
          failedChallengeWords: move.failedChallenge.words,
        })
      } else if (move.successfulChallenge) {
        // Successful challenge - pass with rejected words recorded
        history.push({
          words: [],
          score: 0,
          tiles: [],
          isSuccessfulChallenge: true,
          successfulChallengeWords: move.successfulChallenge.words,
        })
      } else {
        const wordsWithBlanks = getWordsWithBlankInfo(move.tilesPlaced, boardState)
        const words = wordsWithBlanks.map(w => w.word)
        const score = calculateMoveScore({ move: move.tilesPlaced, board: boardState })
        const tiles = move.tilesPlaced.map(({ row, col }) => ({ row, col }))
        history.push({ words, wordsWithBlanks, score, tiles })
      }
    }
    // Update board state after each move
    for (const { row, col, tile } of move.tilesPlaced) {
      boardState[row][col] = tile
    }
  }

  return newestFirst ? history.reverse() : history
}
