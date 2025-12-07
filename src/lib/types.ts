export type SquareType = 'TW' | 'DW' | 'TL' | 'DL' | 'ST' | null

// A tile placed on the board
export type PlacedTile = {
  letter: string
  isBlank: boolean // If true, the tile was originally blank
  value: number
}

// Board position
export type Position = {
  row: number // 0-14
  col: number // 0-14
}

// A single word placement in a move
export type WordPlacement = {
  word: string
  startPosition: Position
  direction: 'horizontal' | 'vertical'
  score: number
}

// A move in the game
export type Move = {
  id: string
  playerIndex: number
  words: WordPlacement[] // Can score multiple words in one move
  totalScore: number
  tilesPlaced: Array<Position & { tile: PlacedTile }>
  timestamp: number
  isBingo: boolean // Used all 7 tiles (50 point bonus)
}

// Player state
export type Player = {
  name: string
  score: number
  timeRemainingMs: number // Milliseconds remaining on their clock
  color: string // Assigned color for UI
}

// Board state - 15x15 grid
export type BoardState = Array<Array<PlacedTile | null>>

// Game status
export type GameStatus = 'setup' | 'playing' | 'paused' | 'finished'

// Complete game state
export type Game = {
  id: string
  players: Player[]
  currentPlayerIndex: number
  board: BoardState
  moves: Move[]
  status: GameStatus
  timerRunning: boolean
  createdAt: number
  updatedAt: number
}

// Player record for storing previously used names
export type PlayerRecord = {
  name: string
  gamesPlayed: number
  lastPlayedAt: number
}

// Past game summary for home screen
export type GameSummary = {
  id: string
  date: number
  players: Array<{
    name: string
    score: number
    isWinner: boolean
  }>
}

// Default time per player (30 minutes)
export const DEFAULT_TIME_MS = 30 * 60 * 1000

// Player colors
export const PLAYER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'] // blue, red, green, amber

// Create an empty 15x15 board
export const createEmptyBoard = (): BoardState => {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
}

// Create initial player state
export const createPlayer = (name: string, colorIndex: number): Player => ({
  name,
  score: 0,
  timeRemainingMs: DEFAULT_TIME_MS,
  color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
})
