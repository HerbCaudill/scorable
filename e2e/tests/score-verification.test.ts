import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { PlayerSetupPage } from '../pages/player-setup.page'
import { GamePage } from '../pages/game.page'
import { loadGcgGame, getNewTiles, applyMoveToBoard, getPlayerNames } from '../fixtures/gcg-fixtures'
import type { GcgGame, GcgPlayMove } from '../../src/lib/parseGcg'
import type { BoardState } from '../../src/lib/types'

const createEmptyBoard = (): BoardState => {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
}

/**
 * Play through a GCG game and verify scores after each move.
 *
 * Note: This tracks scores based on the individual move scores, not the GCG
 * cumulative scores. This is because:
 * 1. The app doesn't implement challenge bonuses (+5 for successful challenges)
 * 2. Some GCG files have unusual notation around challenges
 *
 * Returns an array of any score mismatches found.
 */
async function playAndVerifyScores(
  page: import('@playwright/test').Page,
  gcg: GcgGame
): Promise<Array<{ moveIndex: number; player: string; expected: number; actual: number }>> {
  const [player1, player2] = getPlayerNames(gcg)
  const mismatches: Array<{ moveIndex: number; player: string; expected: number; actual: number }> = []

  // Start new game through UI
  const homePage = new HomePage(page)
  await homePage.goto()
  await homePage.clickNewGame()

  const playerSetup = new PlayerSetupPage(page)
  await playerSetup.addNewPlayer(0, player1)
  await playerSetup.addNewPlayer(1, player2)
  await playerSetup.startGame()

  const gamePage = new GamePage(page)
  await gamePage.expectOnGameScreen()

  // Build set of move indices that were challenged off (play was invalidated)
  const challengedOffIndices = new Set<number>()
  for (let i = 0; i < gcg.moves.length - 1; i++) {
    const move = gcg.moves[i]
    const nextMove = gcg.moves[i + 1]
    // A play is challenged off if it's followed by a challenge move from the SAME player
    // (indicating the play was removed and they now need to play again)
    if (move.type === 'play' && nextMove.type === 'challenge' && move.player === nextMove.player) {
      challengedOffIndices.add(i)
    }
  }

  // Track board state and expected scores
  // We compute expected scores from individual move scores, not cumulative,
  // because cumulative includes challenge bonuses the app doesn't implement
  let board = createEmptyBoard()
  const expectedScores: Record<string, number> = {
    [gcg.player1.nickname]: 0,
    [gcg.player2.nickname]: 0,
  }

  for (let moveIndex = 0; moveIndex < gcg.moves.length; moveIndex++) {
    const move = gcg.moves[moveIndex]

    // Skip 'end' type moves (end-game scoring)
    if (move.type === 'end') continue

    // Skip plays that were challenged off
    if (challengedOffIndices.has(moveIndex)) continue

    if (move.type === 'play') {
      const playMove = move as GcgPlayMove
      const newTiles = getNewTiles(playMove, board)

      if (newTiles.length > 0) {
        const direction = playMove.position.direction

        // Place each tile at its specific position
        for (let i = 0; i < newTiles.length; i++) {
          const tile = newTiles[i]
          await gamePage.clickCell(tile.row, tile.col)
          if (i === 0 && direction === 'vertical') {
            await gamePage.clickCell(tile.row, tile.col)
          }
          if (tile.tile === ' ') {
            await gamePage.pressKey(' ')
          } else {
            await gamePage.typeLetters(tile.tile)
          }
        }

        await gamePage.endTurn()
        board = applyMoveToBoard(playMove, board)
      }

      // Add the move score to expected total
      expectedScores[move.player] += move.score
    } else if (move.type === 'exchange') {
      // Exchange = pass in our app (no tiles placed, no score change)
      await gamePage.endTurn()
      await page.waitForSelector('[role="alertdialog"]', { timeout: 5000 })
      await gamePage.confirmPass()
      await page.waitForSelector('[role="alertdialog"]', { state: 'detached', timeout: 5000 })
      // No score change for exchanges
    } else if (move.type === 'challenge') {
      // Challenge in GCG can mean:
      // 1. Successful challenge (opponent's word removed) - handled by challengedOffIndices
      // 2. Failed challenge (challenger loses turn, sometimes gets -5 or opponent gets +5)
      //
      // When we see a challenge move, it means the previous play was valid,
      // so we just pass (the challenger loses their turn)
      await gamePage.endTurn()
      await page.waitForSelector('[role="alertdialog"]', { timeout: 5000 })
      await gamePage.confirmPass()
      await page.waitForSelector('[role="alertdialog"]', { state: 'detached', timeout: 5000 })
      // No score change - app doesn't implement challenge bonuses
    }

    // Verify scores after each move
    const player1Score = await gamePage.getPlayerScore(0)
    const player2Score = await gamePage.getPlayerScore(1)

    if (player1Score !== expectedScores[gcg.player1.nickname]) {
      mismatches.push({
        moveIndex,
        player: player1,
        expected: expectedScores[gcg.player1.nickname],
        actual: player1Score,
      })
    }

    if (player2Score !== expectedScores[gcg.player2.nickname]) {
      mismatches.push({
        moveIndex,
        player: player2,
        expected: expectedScores[gcg.player2.nickname],
        actual: player2Score,
      })
    }
  }

  return mismatches
}

// List of GCG files to test
const gcgFiles = [
  'cresta-yorra-2006.gcg',
  'anno57595.gcg',
  'anno57629.gcg',
  'anno57680.gcg',
  'anno57691.gcg',
  'anno57697.gcg',
  'anno57701.gcg',
  'anno57721.gcg',
  'anno57741.gcg',
]

for (const gcgFile of gcgFiles) {
  test(`verifies running scores for ${gcgFile}`, async ({ page }) => {
    test.setTimeout(180000) // 3 minutes per game

    const gcg = loadGcgGame(gcgFile)
    const mismatches = await playAndVerifyScores(page, gcg)

    if (mismatches.length > 0) {
      const details = mismatches
        .map(m => `Move ${m.moveIndex}: ${m.player} expected ${m.expected}, got ${m.actual}`)
        .join('\n')
      expect(mismatches, `Score mismatches found:\n${details}`).toHaveLength(0)
    }
  })
}
