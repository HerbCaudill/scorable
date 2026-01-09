export type SquareType = "TW" | "DW" | "TL" | "DL" | "ST" | null

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
export type GameStatus = "setup" | "playing" | "paused" | "finished"

/** Timer event for tracking timer state changes */
export type TimerEvent = {
  type: "start" | "pause" | "switch"
  timestamp: number
  playerIndex: number
}

/** Computed timer state derived from timer events */
export type TimerState = {
  timeRemaining: number[] // ms remaining per player
  activePlayerIndex: number | null // whose timer is running, or null if paused
  isRunning: boolean
}

/** Complete game state  */
export type Game = {
  players: Player[]
  currentPlayerIndex: number
  board: BoardState
  moves: GameMove[]
  timerEvents: TimerEvent[]
  status: GameStatus
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
export const PLAYER_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"] // blue, red, green, amber

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

/** Compute current timer state from timer events */
export const computeTimerState = (events: TimerEvent[], playerCount: number): TimerState => {
  const timeRemaining = Array.from({ length: playerCount }, () => DEFAULT_TIME_MS)
  let activePlayerIndex: number | null = null
  let lastEventTime = 0

  for (const event of events) {
    // Deduct elapsed time from the active player since the last event
    if (activePlayerIndex !== null) {
      timeRemaining[activePlayerIndex] -= event.timestamp - lastEventTime
    }

    // Apply the event
    if (event.type === "pause") {
      activePlayerIndex = null
    } else {
      activePlayerIndex = event.playerIndex
    }
    lastEventTime = event.timestamp
  }

  // If timer is running, deduct time since the last event
  const now = Date.now()
  if (activePlayerIndex !== null) {
    timeRemaining[activePlayerIndex] -= now - lastEventTime
  }

  return {
    timeRemaining: timeRemaining.map(t => Math.max(0, t)),
    activePlayerIndex,
    isRunning: activePlayerIndex !== null,
  }
}
