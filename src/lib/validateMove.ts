import type { BoardState, Move } from "./types"
import { MAX_TILES_PER_MOVE } from "./constants"

export type ValidationResult = { valid: true } | { valid: false; error: string }

/**
 * Validate a move before committing
 *
 * Rules:
 * - Empty move is valid (player passes)
 * - Cannot play more than 7 tiles (rack size)
 * - First move must include center square (7,7)
 * - All tiles must be in a single line (horizontal or vertical)
 * - Subsequent moves must connect to existing tiles
 * - No gaps allowed in the word
 */
export const validateMove = (
  move: Move,
  board: BoardState,
  isFirstMove: boolean,
): ValidationResult => {
  // Empty move is valid (player passes)
  if (move.length === 0) {
    return { valid: true }
  }

  // Cannot play more than 7 tiles (rack size)
  if (move.length > MAX_TILES_PER_MOVE) {
    return { valid: false, error: `Cannot play more than ${MAX_TILES_PER_MOVE} tiles` }
  }

  // All tiles must be in a single line
  const rows = new Set(move.map(t => t.row))
  const cols = new Set(move.map(t => t.col))
  const isHorizontal = rows.size === 1
  const isVertical = cols.size === 1

  if (!isHorizontal && !isVertical) {
    return { valid: false, error: "Tiles must be in a single row or column" }
  }

  // First move must include center square (7,7)
  if (isFirstMove) {
    const includesCenter = move.some(t => t.row === 7 && t.col === 7)
    if (!includesCenter) {
      return { valid: false, error: "First word must include the center square" }
    }
    // First move is valid if it includes center and has more than one tile
    // (or connects to nothing, which is fine for the first move)
    return checkForGaps(move, board, isHorizontal)
  }

  // Subsequent moves must connect to existing tiles
  const connectsToExisting = move.some(({ row, col }) => {
    // Check all 4 adjacent squares
    const adjacent = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ]
    return adjacent.some(([r, c]) => {
      if (r < 0 || r >= 15 || c < 0 || c >= 15) return false
      return board[r][c] !== null
    })
  })

  if (!connectsToExisting) {
    return { valid: false, error: "Word must connect to existing tiles" }
  }

  // Check for gaps in the word
  return checkForGaps(move, board, isHorizontal)
}

/**
 * Check that tiles form a continuous word with no empty gaps
 */
const checkForGaps = (move: Move, board: BoardState, isHorizontal: boolean): ValidationResult => {
  // Create temporary board with new tiles
  const tempBoard = board.map(r => [...r])
  move.forEach(({ row, col, tile }) => {
    tempBoard[row][col] = tile
  })

  if (isHorizontal) {
    const row = move[0].row
    const minCol = Math.min(...move.map(t => t.col))
    const maxCol = Math.max(...move.map(t => t.col))

    for (let c = minCol; c <= maxCol; c++) {
      if (tempBoard[row][c] === null) {
        return { valid: false, error: "Word cannot have gaps" }
      }
    }
  } else {
    const col = move[0].col
    const minRow = Math.min(...move.map(t => t.row))
    const maxRow = Math.max(...move.map(t => t.row))

    for (let r = minRow; r <= maxRow; r++) {
      if (tempBoard[r][col] === null) {
        return { valid: false, error: "Word cannot have gaps" }
      }
    }
  }

  return { valid: true }
}
