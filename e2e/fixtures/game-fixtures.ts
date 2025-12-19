import type { Game, Player, BoardState, GameMove } from '../../src/lib/types'
import { parseGcgToGame } from './gcgToGame'

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

// Real game from GCG file (anno57595.gcg - Brian vs Elise)
// This game ended with Elise going out, leaving Brian with INN (3 tiles)
// We stop 1 move before the end to have a near-end game state
const NEAR_END_GAME_GCG = `#player1 Alice Alice
#player2 Bob Bob
>Alice: III -III +0 0
>Bob: RIMGANI 8G RIM +10 10
>Alice: CHANERS H5 CHA.NERS +64 64
>Bob: GEARING J7 GEARING +67 77
>Alice: CUP F8 CUP +22 86
>Bob: HEFIJAM 5H .HEF +24 101
>Alice: EIOSTUR L5 STOURIE +71 157
>Bob: MAOIAJE E9 MOAI +20 121
>Bob: DOFAJEE (challenge) +5 126
>Alice: BY D12 BY +22 179
>Bob: DOFAJEE C11 DOF +35 161
>Alice: GED D8 GED +18 197
>Bob: AJEEAQL M11 AJEE +24 185
>Alice: POUTINE B5 POUTINE +66 263
>Bob: AXIWELQ A8 AX +42 227
>Alice: IVOT 5B .IVOT +20 283
>Bob: ELLNQWI N9 QIN +17 244
>Alice: LADLE A11 LADLE +25 308
>Bob: AVWELL? 6L .AV +14 258
>Alice: ZESTY O4 ZESTY +88 396
>Bob: ?WALLE? 15A .nWALLEd +80 338
>Bob: SAWEDRK (challenge) +5 343
>Alice: OO 6G O.O +11 407
>Bob: SAWEDRK 14J SAW.D +34 377
>Alice: BO 15K BO +15 422
>Bob: KITTRU J2 KIT. +18 395
>Alice: NRINE 4M RE. +12 434
`

/**
 * Create a game near the end with few tiles remaining.
 * Uses real game data from a GCG file, stopping before the final moves.
 * For 2 players: threshold is (2-1) * 7 = 7 tiles
 * Alice made the last move, so she would be shown as who ended the game.
 */
export function createNearEndGame(playerNames: string[]): Game {
  // Parse the GCG and create the game
  // The game has Alice as the last player to make a move
  const game = parseGcgToGame(NEAR_END_GAME_GCG, {
    playerNames: [playerNames[0], playerNames[1]],
  })

  return game
}
