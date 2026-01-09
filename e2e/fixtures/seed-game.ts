import { Page } from '@playwright/test'

const PLAYER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']
const DEFAULT_TIME_MS = 30 * 60 * 1000

export type SeedGameOptions = {
  playerNames: string[]
  moves?: Array<{
    playerIndex: number
    tilesPlaced: Array<{ row: number; col: number; tile: string }>
  }>
  status?: 'playing' | 'finished'
}

/**
 * Clears all storage (localStorage and IndexedDB) for a clean test slate.
 */
async function clearAllStorage(page: Page) {
  await page.evaluate(async () => {
    localStorage.clear()
    const databases = await indexedDB.databases()
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name)
      }
    }
  })
}

/**
 * Seeds a game directly into Automerge/IndexedDB, bypassing the UI setup.
 * This is much faster than clicking through the player setup screens.
 *
 * Automatically clears storage first to ensure a clean slate.
 *
 * IMPORTANT: This should only be used for tests that don't need to verify
 * the player setup flow. There should be separate tests that verify
 * game creation through the UI.
 */
export async function seedGame(page: Page, options: SeedGameOptions): Promise<string> {
  const { playerNames, moves = [], status = 'playing' } = options

  // Navigate to app, clear storage, then reload to get fresh repo
  await page.goto('/')
  await clearAllStorage(page)
  await page.reload()

  // Wait for the app to initialize and expose the repo
  await page.waitForFunction(() => window.__TEST_REPO__ !== undefined, { timeout: 5000 })

  // Create the game document using the app's Automerge repo
  const gameId = await page.evaluate(
    ({ playerNames, moves, status, PLAYER_COLORS, DEFAULT_TIME_MS }) => {
      const repo = window.__TEST_REPO__
      if (!repo) throw new Error('Test repo not available')

      // Create empty board
      const board: string[][] = Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => ''))

      // Apply moves to board
      for (const move of moves) {
        for (const { row, col, tile } of move.tilesPlaced) {
          board[row][col] = tile
        }
      }

      // Calculate current player
      const currentPlayerIndex = moves.length > 0 ? (moves[moves.length - 1].playerIndex + 1) % playerNames.length : 0

      // Create the game document
      const handle = repo.create()
      handle.change((d: Record<string, unknown>) => {
        d.players = playerNames.map((name: string, i: number) => ({
          name,
          timeRemainingMs: DEFAULT_TIME_MS,
          color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        }))
        d.currentPlayerIndex = currentPlayerIndex
        d.board = board
        d.moves = moves.map(m => ({
          playerIndex: m.playerIndex,
          tilesPlaced: m.tilesPlaced.map(t => ({ row: t.row, col: t.col, tile: t.tile })),
        }))
        d.timerEvents = []
        d.status = status
        d.createdAt = Date.now()
        d.updatedAt = Date.now()
      })

      const documentId = handle.documentId

      // Update localStorage to include this game ID
      const storageKey = 'scrabble-local-storage'
      const existing = localStorage.getItem(storageKey)
      const state = existing ? JSON.parse(existing) : { state: { knownGameIds: [], playerRecords: [] }, version: 0 }

      if (!state.state.knownGameIds.includes(documentId)) {
        state.state.knownGameIds.unshift(documentId)
      }

      // Add player records
      for (const name of playerNames) {
        const existingPlayer = state.state.playerRecords.find(
          (r: { name: string }) => r.name.toLowerCase() === name.toLowerCase()
        )
        if (existingPlayer) {
          existingPlayer.gamesPlayed++
          existingPlayer.lastPlayedAt = Date.now()
        } else {
          state.state.playerRecords.push({
            name,
            gamesPlayed: 1,
            lastPlayedAt: Date.now(),
          })
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(state))

      // Navigate via hash change (faster than page.goto)
      window.location.hash = documentId

      return documentId
    },
    { playerNames, moves, status, PLAYER_COLORS, DEFAULT_TIME_MS }
  )

  // Wait for the game screen to be ready
  await page.waitForSelector('[role="grid"][aria-label="Scrabble board"]')

  return gameId
}

/**
 * Seeds a game and navigates to the game screen.
 * Convenience wrapper for the most common test setup.
 */
export async function seedTwoPlayerGame(page: Page, player1 = 'Alice', player2 = 'Bob') {
  return seedGame(page, { playerNames: [player1, player2] })
}

/**
 * Seeds a game with some moves already played.
 */
export async function seedGameWithMoves(
  page: Page,
  playerNames: string[],
  moves: Array<{
    playerIndex: number
    tilesPlaced: Array<{ row: number; col: number; tile: string }>
  }>
) {
  return seedGame(page, { playerNames, moves })
}

/**
 * Seeds a finished game for testing past games.
 */
export async function seedFinishedGame(page: Page, playerNames: string[]) {
  return seedGame(page, {
    playerNames,
    moves: [
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
    ],
    status: 'finished',
  })
}

// Pre-computed moves from near-end-game.gcg (93 tiles played, 7 remaining)
const NEAR_END_GAME_MOVES = [
  { playerIndex: 1, tilesPlaced: [{ row: 7, col: 6, tile: 'R' }, { row: 7, col: 7, tile: 'I' }, { row: 7, col: 8, tile: 'M' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 4, col: 7, tile: 'C' }, { row: 4, col: 8, tile: 'H' }, { row: 4, col: 9, tile: 'A' }, { row: 4, col: 11, tile: 'N' }, { row: 4, col: 12, tile: 'E' }, { row: 4, col: 13, tile: 'R' }, { row: 4, col: 14, tile: 'S' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 6, col: 9, tile: 'G' }, { row: 6, col: 10, tile: 'E' }, { row: 6, col: 11, tile: 'A' }, { row: 6, col: 12, tile: 'R' }, { row: 6, col: 13, tile: 'I' }, { row: 6, col: 14, tile: 'N' }, { row: 7, col: 14, tile: 'G' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 5, col: 7, tile: 'C' }, { row: 6, col: 7, tile: 'U' }, { row: 8, col: 7, tile: 'P' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 4, col: 8, tile: 'H' }, { row: 4, col: 9, tile: 'E' }, { row: 4, col: 10, tile: 'F' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 4, col: 11, tile: 'S' }, { row: 5, col: 11, tile: 'T' }, { row: 6, col: 11, tile: 'O' }, { row: 7, col: 11, tile: 'U' }, { row: 8, col: 11, tile: 'R' }, { row: 9, col: 11, tile: 'I' }, { row: 10, col: 11, tile: 'E' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 8, col: 4, tile: 'M' }, { row: 8, col: 5, tile: 'O' }, { row: 8, col: 6, tile: 'A' }, { row: 8, col: 8, tile: 'I' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 11, col: 3, tile: 'B' }, { row: 11, col: 4, tile: 'Y' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 10, col: 2, tile: 'D' }, { row: 10, col: 3, tile: 'O' }, { row: 10, col: 4, tile: 'F' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 7, col: 3, tile: 'G' }, { row: 8, col: 3, tile: 'E' }, { row: 9, col: 3, tile: 'D' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 10, col: 12, tile: 'A' }, { row: 10, col: 13, tile: 'J' }, { row: 10, col: 14, tile: 'E' }, { row: 11, col: 14, tile: 'E' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 1, col: 4, tile: 'P' }, { row: 2, col: 4, tile: 'O' }, { row: 3, col: 4, tile: 'U' }, { row: 4, col: 4, tile: 'T' }, { row: 5, col: 4, tile: 'I' }, { row: 6, col: 4, tile: 'N' }, { row: 7, col: 4, tile: 'E' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 7, col: 0, tile: 'A' }, { row: 7, col: 1, tile: 'X' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 4, col: 2, tile: 'I' }, { row: 4, col: 3, tile: 'V' }, { row: 4, col: 5, tile: 'T' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 8, col: 13, tile: 'Q' }, { row: 8, col: 14, tile: 'I' }, { row: 9, col: 14, tile: 'N' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 10, col: 0, tile: 'L' }, { row: 10, col: 1, tile: 'A' }, { row: 11, col: 1, tile: 'D' }, { row: 12, col: 1, tile: 'L' }, { row: 13, col: 1, tile: 'E' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 5, col: 12, tile: 'A' }, { row: 5, col: 13, tile: 'V' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 3, col: 14, tile: 'Z' }, { row: 4, col: 14, tile: 'E' }, { row: 5, col: 14, tile: 'S' }, { row: 6, col: 14, tile: 'T' }, { row: 7, col: 14, tile: 'Y' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 14, col: 1, tile: ' ' }, { row: 14, col: 2, tile: 'W' }, { row: 14, col: 3, tile: 'A' }, { row: 14, col: 4, tile: 'L' }, { row: 14, col: 5, tile: 'L' }, { row: 14, col: 6, tile: 'E' }, { row: 14, col: 7, tile: ' ' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 6, col: 6, tile: 'O' }, { row: 8, col: 6, tile: 'O' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 13, col: 9, tile: 'S' }, { row: 13, col: 10, tile: 'A' }, { row: 13, col: 11, tile: 'W' }, { row: 13, col: 13, tile: 'D' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 14, col: 10, tile: 'B' }, { row: 14, col: 11, tile: 'O' }] },
  { playerIndex: 1, tilesPlaced: [{ row: 1, col: 9, tile: 'K' }, { row: 1, col: 10, tile: 'I' }, { row: 1, col: 11, tile: 'T' }] },
  { playerIndex: 0, tilesPlaced: [{ row: 3, col: 12, tile: 'R' }, { row: 3, col: 13, tile: 'E' }] },
]

/**
 * Seeds a game that's near the end (for testing end-game flow).
 * Uses a pre-defined game state with most tiles played (93 tiles, 7 remaining).
 * Last move was by Alice (playerIndex 0), so it's Bob's turn.
 */
export async function seedNearEndGame(page: Page) {
  return seedGame(page, {
    playerNames: ['Alice', 'Bob'],
    moves: NEAR_END_GAME_MOVES,
    status: 'playing',
  })
}
