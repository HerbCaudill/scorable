import { Page } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { PlayerSetupPage } from '../pages/player-setup.page'
import { GamePage } from '../pages/game.page'
import { loadGcgGame, getNewTiles, applyMoveToBoard, getPlayerNames } from './gcg-fixtures'
import { parseGcg, type GcgGame, type GcgPlayMove } from '../../src/lib/parseGcg'
import type { BoardState } from '../../src/lib/types'

const createEmptyBoard = (): BoardState => {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
}

export type ReplayOptions = {
  /** Stop after this many moves (undefined = play all moves) */
  stopAfterMoves?: number
  /** Player names to use (defaults to names from GCG file) */
  playerNames?: [string, string]
}

/**
 * Start a new game through the UI and replay moves from a GCG file.
 * Goes through: Home → New Game → Player Setup → Play moves on board
 */
export async function replayGcgGame(
  page: Page,
  gcgFilename: string,
  options: ReplayOptions = {}
): Promise<{ gamePage: GamePage; board: BoardState }> {
  const gcg = loadGcgGame(gcgFilename)
  return replayGcgFromParsed(page, gcg, options)
}

/**
 * Start a new game through the UI and replay moves from inline GCG content.
 * Goes through: Home → New Game → Player Setup → Play moves on board
 */
export async function replayGcgContent(
  page: Page,
  gcgContent: string,
  options: ReplayOptions = {}
): Promise<{ gamePage: GamePage; board: BoardState }> {
  const gcg = parseGcg(gcgContent)
  return replayGcgFromParsed(page, gcg, options)
}

/**
 * Start a new game through the UI and replay moves from a parsed GCG game.
 */
export async function replayGcgFromParsed(
  page: Page,
  gcg: GcgGame,
  options: ReplayOptions = {}
): Promise<{ gamePage: GamePage; board: BoardState }> {
  const { stopAfterMoves, playerNames } = options

  // Get player names from GCG or options
  const [player1, player2] = playerNames ?? getPlayerNames(gcg)

  // Start new game through UI
  const homePage = new HomePage(page)
  await homePage.goto()
  await homePage.clickNewGame()

  // Set up players
  const playerSetup = new PlayerSetupPage(page)
  await playerSetup.addNewPlayer(0, player1)
  await playerSetup.addNewPlayer(1, player2)
  await playerSetup.startGame()

  // Now on game screen
  const gamePage = new GamePage(page)
  await gamePage.expectOnGameScreen()

  // Build set of move indices that were challenged off
  const challengedOffIndices = new Set<number>()
  for (let i = 0; i < gcg.moves.length - 1; i++) {
    const move = gcg.moves[i]
    const nextMove = gcg.moves[i + 1]
    if (move.type === 'play' && nextMove.type === 'challenge' && move.player === nextMove.player) {
      challengedOffIndices.add(i)
    }
  }

  // Track board state and move count
  let board = createEmptyBoard()
  let playedMoves = 0

  for (let moveIndex = 0; moveIndex < gcg.moves.length; moveIndex++) {
    // Check if we should stop
    if (stopAfterMoves !== undefined && playedMoves >= stopAfterMoves) {
      break
    }

    const move = gcg.moves[moveIndex]

    // Skip plays that were challenged off
    if (challengedOffIndices.has(moveIndex)) {
      continue
    }

    if (move.type === 'play') {
      const playMove = move as GcgPlayMove
      const newTiles = getNewTiles(playMove, board)

      if (newTiles.length > 0) {
        const direction = playMove.position.direction

        // Place each tile at its specific position
        for (let i = 0; i < newTiles.length; i++) {
          const tile = newTiles[i]

          // Click the tile position
          await gamePage.clickCell(tile.row, tile.col)

          // On first tile, set direction if vertical
          if (i === 0 && direction === 'vertical') {
            await gamePage.clickCell(tile.row, tile.col) // Toggle to vertical
          }

          // Type the tile letter
          if (tile.tile === ' ') {
            await gamePage.pressKey(' ') // Blank tile
          } else {
            await gamePage.typeLetters(tile.tile)
          }
        }

        // End turn
        await gamePage.endTurn()

        // Update our tracked board
        board = applyMoveToBoard(playMove, board)
        playedMoves++
      }
    } else if (move.type === 'exchange' || move.type === 'challenge') {
      // Treat as pass - click on current player panel to trigger pass dialog
      await gamePage.endTurn()
      // Wait for and confirm the pass dialog
      await page.waitForSelector('[role="alertdialog"]', { timeout: 5000 })
      await gamePage.confirmPass()
      // Wait for dialog to close
      await page.waitForSelector('[role="alertdialog"]', { state: 'detached', timeout: 5000 })
      playedMoves++
    }
    // Skip 'end' type moves (end-game scoring)
  }

  return { gamePage, board }
}
