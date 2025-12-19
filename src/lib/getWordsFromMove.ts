import type { BoardState, Move } from './types'
import { getWordAt } from './calculateMoveScore'

/**
 * Extract all words formed by a move
 * Returns array of word strings (main word first, then cross words)
 * Blank tiles are displayed as underscore
 */
export const getWordsFromMove = (move: Move, board: BoardState): string[] => {
  if (move.length === 0) return []

  // Create temp board with new tiles
  const tempBoard = board.map(r => [...r])
  move.forEach(({ row, col, tile }) => {
    tempBoard[row][col] = tile
  })

  const words: string[] = []
  const isHorizontal = new Set(move.map(t => t.row)).size === 1

  // Get main word
  const firstTile = move[0]
  const mainWord = getWordAt(firstTile.row, firstTile.col, tempBoard, isHorizontal)
  if (mainWord.length > 1) {
    words.push(wordToString(mainWord))
  }

  // For single tile, check if there's a word in the perpendicular direction
  if (move.length === 1) {
    const crossWord = getWordAt(firstTile.row, firstTile.col, tempBoard, !isHorizontal)
    if (crossWord.length > 1) {
      // If there's no main word, this becomes the main word
      if (words.length === 0) {
        words.push(wordToString(crossWord))
      } else {
        words.push(wordToString(crossWord))
      }
    }
    return words
  }

  // Get cross words for each placed tile
  for (const { row, col } of move) {
    const crossWord = getWordAt(row, col, tempBoard, !isHorizontal)
    if (crossWord.length > 1) {
      words.push(wordToString(crossWord))
    }
  }

  return words
}

/**
 * Convert word tiles to string, showing blanks as underscore
 */
const wordToString = (word: Array<{ row: number; col: number; tile: string }>): string => {
  return word.map(t => (t.tile === ' ' ? '_' : t.tile)).join('')
}
