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

/**
 * Create a game near the end with few tiles remaining.
 * For 2 players: threshold is (2-1) * 7 = 7 tiles
 * So we need remaining tiles <= 7 to trigger EndGameScreen.
 *
 * Standard distribution (100 tiles):
 * A:9 B:2 C:2 D:4 E:12 F:2 G:3 H:2 I:9 J:1 K:1 L:4 M:2 N:6 O:8 P:2 Q:1 R:6 S:4 T:6 U:4 V:2 W:2 X:1 Y:2 Z:1 Blank:2
 *
 * We'll play 93+ tiles to leave <= 7.
 */
export function createNearEndGame(playerNames: string[]): Game {
  const moves: GameMove[] = []

  // Track used tiles to ensure we don't exceed distribution
  const used: Record<string, number> = {}
  const addMove = (playerIndex: number, tiles: Array<{ row: number; col: number; tile: string }>) => {
    for (const { tile } of tiles) {
      const letter = tile.toUpperCase()
      used[letter] = (used[letter] || 0) + 1
    }
    moves.push({ playerIndex, tilesPlaced: tiles })
  }

  // Row 7 center: AEIOU + common letters (7 tiles) - A:1, E:1, I:1, O:1, U:1, R:1, T:1
  addMove(0, [
    { row: 7, col: 4, tile: 'A' },
    { row: 7, col: 5, tile: 'E' },
    { row: 7, col: 6, tile: 'I' },
    { row: 7, col: 7, tile: 'O' },
    { row: 7, col: 8, tile: 'U' },
    { row: 7, col: 9, tile: 'R' },
    { row: 7, col: 10, tile: 'T' },
  ])

  // Row 6: more common tiles (7) - E:1, A:1, I:1, O:1, N:1, S:1, L:1
  addMove(1, [
    { row: 6, col: 4, tile: 'E' },
    { row: 6, col: 5, tile: 'A' },
    { row: 6, col: 6, tile: 'I' },
    { row: 6, col: 7, tile: 'O' },
    { row: 6, col: 8, tile: 'N' },
    { row: 6, col: 9, tile: 'S' },
    { row: 6, col: 10, tile: 'L' },
  ])

  // Row 8: (7) - T:1, R:1, E:1, A:1, D:1, I:1, N:1
  addMove(0, [
    { row: 8, col: 4, tile: 'T' },
    { row: 8, col: 5, tile: 'R' },
    { row: 8, col: 6, tile: 'E' },
    { row: 8, col: 7, tile: 'A' },
    { row: 8, col: 8, tile: 'D' },
    { row: 8, col: 9, tile: 'I' },
    { row: 8, col: 10, tile: 'N' },
  ])

  // Row 5: (7) - O:1, N:1, E:1, S:1, T:1, A:1, R:1
  addMove(1, [
    { row: 5, col: 4, tile: 'O' },
    { row: 5, col: 5, tile: 'N' },
    { row: 5, col: 6, tile: 'E' },
    { row: 5, col: 7, tile: 'S' },
    { row: 5, col: 8, tile: 'T' },
    { row: 5, col: 9, tile: 'A' },
    { row: 5, col: 10, tile: 'R' },
  ])

  // Row 9: (7) - I:1, E:1, A:1, O:1, U:1, L:1, R:1
  addMove(0, [
    { row: 9, col: 4, tile: 'I' },
    { row: 9, col: 5, tile: 'E' },
    { row: 9, col: 6, tile: 'A' },
    { row: 9, col: 7, tile: 'O' },
    { row: 9, col: 8, tile: 'U' },
    { row: 9, col: 9, tile: 'L' },
    { row: 9, col: 10, tile: 'R' },
  ])

  // Row 4: (7) - E:1, I:1, O:1, A:1, N:1, T:1, S:1
  addMove(1, [
    { row: 4, col: 4, tile: 'E' },
    { row: 4, col: 5, tile: 'I' },
    { row: 4, col: 6, tile: 'O' },
    { row: 4, col: 7, tile: 'A' },
    { row: 4, col: 8, tile: 'N' },
    { row: 4, col: 9, tile: 'T' },
    { row: 4, col: 10, tile: 'S' },
  ])

  // Row 10: (7) - A:1, E:1, I:1, O:1, R:1, N:1, D:1
  addMove(0, [
    { row: 10, col: 4, tile: 'A' },
    { row: 10, col: 5, tile: 'E' },
    { row: 10, col: 6, tile: 'I' },
    { row: 10, col: 7, tile: 'O' },
    { row: 10, col: 8, tile: 'R' },
    { row: 10, col: 9, tile: 'N' },
    { row: 10, col: 10, tile: 'D' },
  ])

  // Row 3: (7) - E:1, A:1, I:1, U:1, O:1, L:1, T:1
  addMove(1, [
    { row: 3, col: 4, tile: 'E' },
    { row: 3, col: 5, tile: 'A' },
    { row: 3, col: 6, tile: 'I' },
    { row: 3, col: 7, tile: 'U' },
    { row: 3, col: 8, tile: 'O' },
    { row: 3, col: 9, tile: 'L' },
    { row: 3, col: 10, tile: 'T' },
  ])

  // Row 11: (7) - B:1, C:1, D:1, F:1, G:1, H:1, I:1
  addMove(0, [
    { row: 11, col: 4, tile: 'B' },
    { row: 11, col: 5, tile: 'C' },
    { row: 11, col: 6, tile: 'D' },
    { row: 11, col: 7, tile: 'F' },
    { row: 11, col: 8, tile: 'G' },
    { row: 11, col: 9, tile: 'H' },
    { row: 11, col: 10, tile: 'I' },
  ])

  // Row 2: (7) - O:1, U:1, A:1, E:1, I:1, R:1, N:1
  addMove(1, [
    { row: 2, col: 4, tile: 'O' },
    { row: 2, col: 5, tile: 'U' },
    { row: 2, col: 6, tile: 'A' },
    { row: 2, col: 7, tile: 'E' },
    { row: 2, col: 8, tile: 'I' },
    { row: 2, col: 9, tile: 'R' },
    { row: 2, col: 10, tile: 'N' },
  ])

  // Row 12: (7) - G:1, W:1, P:1, M:1, B:1, C:1, H:1
  addMove(0, [
    { row: 12, col: 4, tile: 'G' },
    { row: 12, col: 5, tile: 'W' },
    { row: 12, col: 6, tile: 'P' },
    { row: 12, col: 7, tile: 'M' },
    { row: 12, col: 8, tile: 'B' },
    { row: 12, col: 9, tile: 'C' },
    { row: 12, col: 10, tile: 'H' },
  ])

  // Row 1: (7) - K:1, V:1, W:1, X:1, Y:1, G:1, J:1
  addMove(1, [
    { row: 1, col: 4, tile: 'K' },
    { row: 1, col: 5, tile: 'V' },
    { row: 1, col: 6, tile: 'W' },
    { row: 1, col: 7, tile: 'X' },
    { row: 1, col: 8, tile: 'Y' },
    { row: 1, col: 9, tile: 'G' },
    { row: 1, col: 10, tile: 'J' },
  ])

  // Row 13: (7) - D:1, F:1, M:1, P:1, U:1, V:1, Y:1
  addMove(0, [
    { row: 13, col: 4, tile: 'D' },
    { row: 13, col: 5, tile: 'F' },
    { row: 13, col: 6, tile: 'M' },
    { row: 13, col: 7, tile: 'P' },
    { row: 13, col: 8, tile: 'U' },
    { row: 13, col: 9, tile: 'V' },
    { row: 13, col: 10, tile: 'Y' },
  ])

  // 13 moves * 7 tiles = 91 tiles.
  // For 2 players, threshold = 7, so we need <= 7 tiles remaining.
  // That means we need to play at least 93 tiles.
  // 91 + 2 = 93 tiles played, 7 remaining. Perfect.

  // Final move by Alice (playerIndex 0) to ensure she's the last player
  // Row 0: (2) - L:1, T:1
  addMove(0, [
    { row: 0, col: 4, tile: 'L' },
    { row: 0, col: 5, tile: 'T' },
  ])

  // Total: 93 tiles played, 7 remaining (Q, Z, and some others)

  const game = createTestGame(playerNames)
  game.moves = moves

  // Update board state
  for (const move of moves) {
    for (const { row, col, tile } of move.tilesPlaced) {
      game.board[row][col] = tile
    }
  }

  // Set current player to next after last move (Alice made last move, so it's Bob's turn, but we want Alice to be shown as who made the last move)
  game.currentPlayerIndex = (moves[moves.length - 1].playerIndex + 1) % playerNames.length

  return game
}
