import type { AutomergeUrl } from '@automerge/automerge-repo'

/** Automerge-compatible player state */
export type PlayerDoc = {
  name: string
  timeRemainingMs: number
  color: string
}

/** Automerge-compatible move position */
export type TilePlacement = {
  row: number
  col: number
  tile: string
}

/** Automerge-compatible adjustment */
export type AdjustmentDoc = {
  rackTiles: string[]
  deduction: number
  bonus: number
}

/** Automerge-compatible game move */
export type GameMoveDoc = {
  playerIndex: number
  tilesPlaced: TilePlacement[]
  adjustment?: AdjustmentDoc
}

/** Game status */
export type GameStatus = 'setup' | 'playing' | 'paused' | 'finished'

/**
 * Automerge-compatible game document.
 * Note: board uses "" instead of null for empty cells since automerge handles strings well.
 */
export type GameDoc = {
  id: string
  players: PlayerDoc[]
  currentPlayerIndex: number
  board: string[][] // 15x15, empty string for unoccupied
  moves: GameMoveDoc[]
  status: GameStatus
  createdAt: number
  updatedAt: number
}

/** Create an empty 15x15 board with empty strings */
export const createEmptyBoardDoc = (): string[][] => {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => ''))
}

export type { AutomergeUrl }
