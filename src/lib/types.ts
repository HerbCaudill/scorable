export type SquareType = 'TW' | 'DW' | 'TL' | 'DL' | 'ST' | null

/** Board position  */
export type Position = {
  row: number // 0-14
  col: number // 0-14
}

/** A set of tiles placed on the board in a single move */
export type Move = Array<
  Position & {
    tile: string
  }
>

/** End-game score adjustment for a player */
export type Adjustment = {
  rackTiles: string[]
  deduction: number
  bonus: number
}

/** A move made by a specific player  */
export type GameMove = {
  playerIndex: number
  tilesPlaced: Move
  adjustment?: Adjustment
}

/** Player state  */
export type Player = {
  name: string
  timeRemainingMs: number // Milliseconds remaining on their clock
  color: string // Assigned color for UI
}

/** Board state - 15x15 grid of either letters or null  */
export type BoardState = Array<Array<string | null>>

/** Game status  */
export type GameStatus = 'setup' | 'playing' | 'paused' | 'finished'

/** Complete game state  */
export type Game = {
  id: string
  players: Player[]
  currentPlayerIndex: number
  board: BoardState
  moves: GameMove[]
  status: GameStatus
  timerRunning: boolean
  createdAt: number
  updatedAt: number
}

/** Player record for storing previously used names  */
export type PlayerRecord = {
  name: string
  gamesPlayed: number
  lastPlayedAt: number
}

/** Default time per player (30 minutes)  */
export const DEFAULT_TIME_MS = 30 * 60 * 1000

/** Player colors  */
export const PLAYER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'] // blue, red, green, amber

/** Create an empty 15x15 board  */
export const createEmptyBoard = (): BoardState => {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
}

/** Create initial player state  */
export const createPlayer = (name: string, colorIndex: number): Player => ({
  name,
  timeRemainingMs: DEFAULT_TIME_MS,
  color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
})
