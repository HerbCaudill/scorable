import type { Game, Player, BoardState, GameMove } from '../../src/lib/types'

const DEFAULT_TIME_MS = 30 * 60 * 1000
const PLAYER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']

function createEmptyBoard(): BoardState {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
}

export function createTestPlayer(name: string, index: number): Player {
  return {
    name,
    timeRemainingMs: DEFAULT_TIME_MS,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
  }
}

export function createTestGame(playerNames: string[], options: Partial<Game> = {}): Game {
  return {
    id: crypto.randomUUID(),
    players: playerNames.map((name, i) => createTestPlayer(name, i)),
    currentPlayerIndex: 0,
    board: createEmptyBoard(),
    moves: [],
    status: 'playing',
    timerRunning: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...options,
  }
}

export function createGameWithMoves(
  playerNames: string[],
  moves: Array<{ playerIndex: number; tilesPlaced: Array<{ row: number; col: number; tile: string }> }>
): Game {
  const game = createTestGame(playerNames)
  game.moves = moves as GameMove[]

  // Update board state
  for (const move of moves) {
    for (const { row, col, tile } of move.tilesPlaced) {
      game.board[row][col] = tile
    }
  }

  // Set current player to next after last move
  if (moves.length > 0) {
    game.currentPlayerIndex = (moves[moves.length - 1].playerIndex + 1) % playerNames.length
  }

  return game
}

export function createFinishedGame(playerNames: string[]): Game {
  const game = createGameWithMoves(playerNames, [
    {
      playerIndex: 0,
      tilesPlaced: [
        { row: 7, col: 7, tile: 'C' },
        { row: 7, col: 8, tile: 'A' },
        { row: 7, col: 9, tile: 'T' },
      ],
    },
    {
      playerIndex: 1,
      tilesPlaced: [
        { row: 6, col: 8, tile: 'B' },
        { row: 8, col: 8, tile: 'S' },
      ],
    },
  ])
  game.status = 'finished'
  return game
}
