import { getkSquareType, getSquareType } from './getSquareType'
import { tileValues } from './tileValues'
import type { BoardState, Move, SquareType } from './types'

export const BINGO_BONUS = 50

/**
 * Calculate the total score for a move, including bingo bonus
 */
export const calculateMoveScore = ({ move, board }: { move: Move; board: BoardState }): number => {
  // Empty move = 0 points
  if (move.length === 0) {
    return 0
  }

  // Create a set of newly placed positions for quick lookup
  const newTilePositions = new Set(move.map(t => `${t.row},${t.col}`))

  // Create a temporary board with the new tiles placed
  const tempBoard: BoardState = board.map(row => [...row])
  for (const { row, col, tile } of move) {
    tempBoard[row][col] = tile
  }

  // Determine if the move is horizontal or vertical
  const isHorizontal = new Set(move.map(t => t.row)).size === 1

  let totalScore = 0

  // Score the main word (the word formed by the placed tiles)
  const mainWordScore = scoreMainWord(move, tempBoard, newTilePositions, isHorizontal)
  totalScore += mainWordScore

  // Score any cross words (perpendicular words formed)
  const crossWordsScore = scoreCrossWords(move, tempBoard, newTilePositions, isHorizontal)
  totalScore += crossWordsScore

  // Add bingo bonus if all 7 tiles were used
  if (move.length === 7) {
    totalScore += BINGO_BONUS
  }

  return totalScore
}

/**
 * Score the main word formed by the move
 */
const scoreMainWord = (move: Move, board: BoardState, newTilePositions: Set<string>, isHorizontal: boolean): number => {
  if (move.length === 0) return 0

  // For a single tile, we need to find which direction forms the main word
  if (move.length === 1) {
    const { row, col } = move[0]

    // Check horizontal word
    const hWord = getWordAt(row, col, board, true)
    // Check vertical word
    const vWord = getWordAt(row, col, board, false)

    // If only one direction forms a word of length > 1, that's the main word
    // If both do, we need to score both (but one will be the "main" and others are "cross")
    // For a single tile, the main word is whichever is longer, or horizontal if equal
    if (hWord.length > 1 && vWord.length <= 1) {
      return scoreWord(hWord, newTilePositions)
    } else if (vWord.length > 1 && hWord.length <= 1) {
      return scoreWord(vWord, newTilePositions)
    } else if (hWord.length > 1 && vWord.length > 1) {
      // Both form words - score horizontal as main, vertical will be cross word
      return scoreWord(hWord, newTilePositions)
    }
    // Single tile with no adjacent tiles - shouldn't happen in a valid game
    return 0
  }

  // Multiple tiles - get the full extent of the word
  const firstTile = move[0]
  const word = getWordAt(firstTile.row, firstTile.col, board, isHorizontal)

  return scoreWord(word, newTilePositions)
}

/**
 * Score all cross words formed perpendicular to the main word
 */
const scoreCrossWords = (
  move: Move,
  board: BoardState,
  newTilePositions: Set<string>,
  isHorizontal: boolean
): number => {
  let score = 0

  // For single tile, if we scored horizontal as main, check vertical as cross
  if (move.length === 1) {
    const { row, col } = move[0]
    const hWord = getWordAt(row, col, board, true)
    const vWord = getWordAt(row, col, board, false)

    // If both form words, we already scored horizontal, so score vertical
    if (hWord.length > 1 && vWord.length > 1) {
      score += scoreWord(vWord, newTilePositions)
    }
    return score
  }

  // For each newly placed tile, check if it forms a word in the perpendicular direction
  for (const { row, col } of move) {
    const crossWord = getWordAt(row, col, board, !isHorizontal)

    // Only score if the cross word has more than 1 tile
    if (crossWord.length > 1) {
      score += scoreWord(crossWord, newTilePositions)
    }
  }

  return score
}

/**
 * Get the full word at a position in a given direction
 */
const getWordAt = (
  row: number,
  col: number,
  board: BoardState,
  horizontal: boolean
): Array<{ row: number; col: number; tile: string }> => {
  const word: Array<{ row: number; col: number; tile: string }> = []

  // Find the start of the word
  let r = row
  let c = col

  if (horizontal) {
    while (c > 0 && board[r][c - 1] !== null) {
      c--
    }
  } else {
    while (r > 0 && board[r - 1][c] !== null) {
      r--
    }
  }

  // Collect all tiles in the word
  while (r < 15 && c < 15 && board[r][c] !== null) {
    word.push({ row: r, col: c, tile: board[r][c]! })
    if (horizontal) {
      c++
    } else {
      r++
    }
  }

  return word
}

/**
 * Calculate the score for a word, applying multipliers for newly placed tiles
 */
const scoreWord = (word: Array<{ row: number; col: number; tile: string }>, newTilePositions: Set<string>): number => {
  let wordScore = 0
  let wordMultiplier = 1

  for (const { row, col, tile } of word) {
    const tileValue = tileValues[tile] ?? 0
    const isNewTile = newTilePositions.has(`${row},${col}`)

    if (isNewTile) {
      // Apply letter and word multipliers only for newly placed tiles
      const squareType = getSquareType(row, col)
      const { letterMultiplier, wordMult } = getMultipliers(squareType)

      wordScore += tileValue * letterMultiplier
      wordMultiplier *= wordMult
    } else {
      // Existing tiles just add their face value
      wordScore += tileValue
    }
  }

  return wordScore * wordMultiplier
}

/**
 * Get the letter and word multipliers for a square type
 */
const getMultipliers = (squareType: SquareType): { letterMultiplier: number; wordMult: number } => {
  switch (squareType) {
    case 'DL':
      return { letterMultiplier: 2, wordMult: 1 }
    case 'TL':
      return { letterMultiplier: 3, wordMult: 1 }
    case 'DW':
    case 'ST': // Center star acts as double word
      return { letterMultiplier: 1, wordMult: 2 }
    case 'TW':
      return { letterMultiplier: 1, wordMult: 3 }
    default:
      return { letterMultiplier: 1, wordMult: 1 }
  }
}
