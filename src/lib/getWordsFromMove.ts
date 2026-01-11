import type { BoardState, Move } from "./types"
import { getWordAt } from "./calculateMoveScore"
import { isBlankTile, getTileDisplayLetter } from "./isBlankTile"

/**
 * Extract all words formed by a move
 * Returns array of word strings (main word first, then cross words)
 * Blank tiles with assigned letters show the letter, unassigned show underscore
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
 * Convert word tiles to string
 * - Regular tiles: show the letter
 * - Blank tiles with assigned letter (lowercase): show the letter in uppercase
 * - Unassigned blank tiles (space): show underscore
 */
const wordToString = (word: Array<{ row: number; col: number; tile: string }>): string => {
  return word
    .map(t => {
      if (t.tile === " ") return "_" // Unassigned blank
      if (isBlankTile(t.tile)) return getTileDisplayLetter(t.tile) // Assigned blank
      return t.tile.toUpperCase() // Regular tile
    })
    .join("")
}

export type WordWithBlankInfo = {
  word: string
  blankIndices: number[] // Indices of characters that are blank tiles
}

/**
 * Extract all words formed by a move, with information about which letters are blanks
 */
export const getWordsWithBlankInfo = (move: Move, board: BoardState): WordWithBlankInfo[] => {
  if (move.length === 0) return []

  // Create temp board with new tiles
  const tempBoard = board.map(r => [...r])
  move.forEach(({ row, col, tile }) => {
    tempBoard[row][col] = tile
  })

  const words: WordWithBlankInfo[] = []
  const isHorizontal = new Set(move.map(t => t.row)).size === 1

  // Get main word
  const firstTile = move[0]
  const mainWord = getWordAt(firstTile.row, firstTile.col, tempBoard, isHorizontal)
  if (mainWord.length > 1) {
    words.push(wordWithBlankInfo(mainWord))
  }

  // For single tile, check if there's a word in the perpendicular direction
  if (move.length === 1) {
    const crossWord = getWordAt(firstTile.row, firstTile.col, tempBoard, !isHorizontal)
    if (crossWord.length > 1) {
      words.push(wordWithBlankInfo(crossWord))
    }
    return words
  }

  // Get cross words for each placed tile
  for (const { row, col } of move) {
    const crossWord = getWordAt(row, col, tempBoard, !isHorizontal)
    if (crossWord.length > 1) {
      words.push(wordWithBlankInfo(crossWord))
    }
  }

  return words
}

/**
 * Convert word tiles to string with blank indices
 */
const wordWithBlankInfo = (
  word: Array<{ row: number; col: number; tile: string }>,
): WordWithBlankInfo => {
  const blankIndices: number[] = []
  const chars = word.map((t, i) => {
    if (t.tile === " ") {
      blankIndices.push(i)
      return "_"
    }
    if (isBlankTile(t.tile)) {
      blankIndices.push(i)
      return getTileDisplayLetter(t.tile)
    }
    return t.tile.toUpperCase()
  })
  return { word: chars.join(""), blankIndices }
}
