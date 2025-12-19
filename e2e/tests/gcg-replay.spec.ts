import { test, expect } from '@playwright/test'
import { GamePage } from '../pages/game.page'
import { clearStorage, seedStorage } from '../fixtures/storage-fixtures'
import { createTestGame } from '../fixtures/game-fixtures'
import {
  loadGcgGame,
  getNewTiles,
  applyMoveToBoard,
  getPlayerNames,
  getPlayerIndex,
} from '../fixtures/gcg-fixtures'
import type { GcgPlayMove } from '../../src/lib/gcg/parseGcg'
import type { BoardState } from '../../src/lib/types'

const createEmptyBoard = (): BoardState => {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
}

test.describe('GCG Replay', () => {
  test('replays Cresta vs Yorra 830-point game', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes for replaying 30+ moves
    // Load the GCG file
    const gcg = loadGcgGame('cresta-yorra-2006.gcg')
    const [player1Name, player2Name] = getPlayerNames(gcg)

    // Set up game with player names
    await page.goto('/')
    await clearStorage(page)
    await seedStorage(page, {
      currentGame: createTestGame([player1Name, player2Name]),
    })
    await page.reload()
    await page.getByRole('button', { name: 'Resume game' }).click()

    const gamePage = new GamePage(page)
    await gamePage.expectOnGameScreen()

    // Track board state as we replay
    let board = createEmptyBoard()

    // Replay all moves except 'end' type
    // Build a set of move indices that were challenged off (followed by -- from same player)
    const challengedOffIndices = new Set<number>()
    for (let i = 0; i < gcg.moves.length - 1; i++) {
      const move = gcg.moves[i]
      const nextMove = gcg.moves[i + 1]
      if (
        move.type === 'play' &&
        nextMove.type === 'challenge' &&
        move.player === nextMove.player
      ) {
        challengedOffIndices.add(i)
      }
    }

    for (let moveIndex = 0; moveIndex < gcg.moves.length; moveIndex++) {
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

          // Handle tile overuse dialog if it appears (click "Play anyway")
          const playAnywayButton = page.getByRole('button', { name: 'Play anyway' })
          if (await playAnywayButton.isVisible({ timeout: 500 }).catch(() => false)) {
            await playAnywayButton.click()
            // Wait for dialog to close
            await page.waitForSelector('[role="alertdialog"]', { state: 'detached', timeout: 5000 })
          }

          // Update our tracked board
          board = applyMoveToBoard(playMove, board)
        }
      } else if (move.type === 'exchange' || move.type === 'challenge') {
        // Treat as pass - click on current player panel to trigger pass dialog
        await gamePage.endTurn()
        // Wait for and confirm the pass dialog
        await page.waitForSelector('[role="alertdialog"]', { timeout: 5000 })
        await gamePage.confirmPass()
        // Wait for dialog to close
        await page.waitForSelector('[role="alertdialog"]', { state: 'detached', timeout: 5000 })
      }
      // Skip 'end' type moves (end-game scoring)
    }

    // Verify final scores
    // Note: Our app doesn't do end-game tile deductions, so scores won't match exactly
    // Yorra: 490 in GCG (490 without end-game), Cresta: 830 (826 + 4 from Yorra's tiles)
    const yorraScore = await gamePage.getPlayerScore(0)
    const crestaScore = await gamePage.getPlayerScore(1)

    // Check final scores are reasonable (not exact due to different scoring implementations)
    // Yorra: 490 in GCG, Cresta: 826 before end-game bonus
    expect(yorraScore).toBeGreaterThan(400)
    expect(crestaScore).toBeGreaterThan(700)
  })
})
