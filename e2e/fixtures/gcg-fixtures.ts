import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { parseGcg, type GcgGame, type GcgPlayMove } from '../../src/lib/parseGcg'
import type { BoardState } from '../../src/lib/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Load and parse a GCG file from the e2e/games directory */
export const loadGcgGame = (filename: string): GcgGame => {
  const filePath = path.join(__dirname, '..', 'games', filename)
  const content = fs.readFileSync(filePath, 'utf-8')
  return parseGcg(content)
}

/** Create an empty 15x15 board */
const createEmptyBoard = (): BoardState => {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
}

/**
 * Extract only the NEW tiles from a GCG play move.
 * Some tiles in the word may already be on the board (when extending words).
 * This function returns only the tiles that need to be placed.
 */
export const getNewTiles = (
  move: GcgPlayMove,
  board: BoardState
): Array<{ row: number; col: number; tile: string }> => {
  const { position, word } = move
  const tiles: Array<{ row: number; col: number; tile: string }> = []

  for (let i = 0; i < word.length; i++) {
    const row = position.direction === 'vertical' ? position.row + i : position.row
    const col = position.direction === 'horizontal' ? position.col + i : position.col

    // Bounds check
    if (row < 0 || row > 14 || col < 0 || col > 14) {
      throw new Error(
        `Position out of bounds: row=${row}, col=${col} for word "${word}" at position (${position.row}, ${position.col}) direction=${position.direction}`
      )
    }

    // Check if this position already has a tile
    if (board[row][col] === null) {
      // Lowercase letters in GCG are blanks - we represent them as spaces
      const letter = word[i]
      const tile = letter === letter.toLowerCase() ? ' ' : letter
      tiles.push({ row, col, tile })
    }
  }

  return tiles
}

/**
 * Apply a play move to a board state, returning the updated board
 */
export const applyMoveToBoard = (move: GcgPlayMove, board: BoardState): BoardState => {
  const newBoard = board.map(row => [...row])
  const { position, word } = move

  for (let i = 0; i < word.length; i++) {
    const row = position.direction === 'vertical' ? position.row + i : position.row
    const col = position.direction === 'horizontal' ? position.col + i : position.col

    // Only place tile if position is empty
    if (newBoard[row][col] === null) {
      const letter = word[i]
      // Lowercase = blank, store as the letter (not space) for display
      // but mark somehow for scoring - for now just use uppercase
      newBoard[row][col] = letter.toUpperCase()
    }
  }

  return newBoard
}

/** Get player names from a GCG game */
export const getPlayerNames = (gcg: GcgGame): [string, string] => {
  return [gcg.player1.name, gcg.player2.name]
}

/** Get the player index (0 or 1) for a move */
export const getPlayerIndex = (gcg: GcgGame, playerNickname: string): number => {
  if (playerNickname === gcg.player1.nickname) return 0
  if (playerNickname === gcg.player2.nickname) return 1
  throw new Error(`Unknown player: ${playerNickname}`)
}

/** Simulate playing through all moves and return the final board state */
export const simulateGame = (gcg: GcgGame): BoardState => {
  let board = createEmptyBoard()

  for (const move of gcg.moves) {
    if (move.type === 'play') {
      board = applyMoveToBoard(move, board)
    }
  }

  return board
}
