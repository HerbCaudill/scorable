import { test, expect } from '@playwright/test'
import { GamePage } from '../pages/game.page'
import { seedTwoPlayerGame, seedGameWithMoves } from '../fixtures/seed-game'

test.describe('Move Actions', () => {
  test.describe('Undo', () => {
    test('undoes the last move and restores board state', async ({ page }) => {
      // Seed a game with one move already played
      await seedGameWithMoves(page, ['Alice', 'Bob'], [
        {
          playerIndex: 0,
          tilesPlaced: [
            { row: 7, col: 7, tile: 'C' },
            { row: 7, col: 8, tile: 'A' },
            { row: 7, col: 9, tile: 'T' },
          ],
        },
      ])

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Verify initial state - CAT is on the board and it's Bob's turn
      await gamePage.expectTileAt(7, 7, 'C')
      await gamePage.expectTileAt(7, 8, 'A')
      await gamePage.expectTileAt(7, 9, 'T')
      expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

      // Undo the move
      await gamePage.undoMove('Alice', 0)

      // Wait for the toast
      await expect(page.getByText('Move undone')).toBeVisible()

      // Board should be empty
      expect(await gamePage.cellHasTile(7, 7)).toBe(false)
      expect(await gamePage.cellHasTile(7, 8)).toBe(false)
      expect(await gamePage.cellHasTile(7, 9)).toBe(false)

      // It should be Alice's turn again
      expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
    })

    test('undo option only appears for the last move', async ({ page }) => {
      // Seed a game with two moves
      await seedGameWithMoves(page, ['Alice', 'Bob'], [
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

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Open menu on Alice's first move (not the last move)
      await gamePage.openMoveMenu('Alice', 0)

      // Should only see Correct, not Undo or Challenge
      await expect(page.getByRole('menuitem', { name: 'Correct' })).toBeVisible()
      await expect(page.getByRole('menuitem', { name: 'Undo' })).not.toBeVisible()
      await expect(page.getByRole('menuitem', { name: 'Challenge' })).not.toBeVisible()

      // Close the menu
      await page.keyboard.press('Escape')

      // Open menu on Bob's last move
      await gamePage.openMoveMenu('Bob', 0)

      // Should see all three options
      await expect(page.getByRole('menuitem', { name: 'Correct' })).toBeVisible()
      await expect(page.getByRole('menuitem', { name: 'Undo' })).toBeVisible()
      await expect(page.getByRole('menuitem', { name: 'Challenge' })).toBeVisible()
    })
  })

  test.describe('Challenge', () => {
    test('successful challenge removes invalid word', async ({ page }) => {
      // Seed a game with an invalid word (XYZ is not a valid word)
      await seedGameWithMoves(page, ['Alice', 'Bob'], [
        {
          playerIndex: 0,
          tilesPlaced: [
            { row: 7, col: 7, tile: 'X' },
            { row: 7, col: 8, tile: 'Y' },
            { row: 7, col: 9, tile: 'Z' },
          ],
        },
      ])

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Verify the word is on the board
      await gamePage.expectTileAt(7, 7, 'X')
      await gamePage.expectTileAt(7, 8, 'Y')
      await gamePage.expectTileAt(7, 9, 'Z')

      // Challenge the move
      await gamePage.challengeMove('Alice', 0)

      // Wait for the success toast
      await expect(page.getByText(/Challenge successful/)).toBeVisible()

      // Board should be empty
      expect(await gamePage.cellHasTile(7, 7)).toBe(false)
      expect(await gamePage.cellHasTile(7, 8)).toBe(false)
      expect(await gamePage.cellHasTile(7, 9)).toBe(false)

      // It should be Alice's turn again
      expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
    })

    test('failed challenge shows error toast', async ({ page }) => {
      // Seed a game with a valid word (CAT is a valid word)
      await seedGameWithMoves(page, ['Alice', 'Bob'], [
        {
          playerIndex: 0,
          tilesPlaced: [
            { row: 7, col: 7, tile: 'C' },
            { row: 7, col: 8, tile: 'A' },
            { row: 7, col: 9, tile: 'T' },
          ],
        },
      ])

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Challenge the move
      await gamePage.challengeMove('Alice', 0)

      // Wait for the failure toast (includes the word CAT in the message)
      await expect(page.getByText(/Challenge failed.*CAT/)).toBeVisible()

      // Board should still have the word
      await gamePage.expectTileAt(7, 7, 'C')
      await gamePage.expectTileAt(7, 8, 'A')
      await gamePage.expectTileAt(7, 9, 'T')

      // It should still be Bob's turn
      expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
    })

    test('challenge option only appears for the last move', async ({ page }) => {
      // Seed a game with two moves
      await seedGameWithMoves(page, ['Alice', 'Bob'], [
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

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Open menu on Alice's first move (not the last move)
      await gamePage.openMoveMenu('Alice', 0)

      // Should not see Challenge
      await expect(page.getByRole('menuitem', { name: 'Challenge' })).not.toBeVisible()

      // Close the menu
      await page.keyboard.press('Escape')

      // Open menu on Bob's last move
      await gamePage.openMoveMenu('Bob', 0)

      // Should see Challenge
      await expect(page.getByRole('menuitem', { name: 'Challenge' })).toBeVisible()
    })

    test('challenge validates cross words too', async ({ page }) => {
      // Seed a game with CAT, then play an invalid cross word
      await seedGameWithMoves(page, ['Alice', 'Bob'], [
        {
          playerIndex: 0,
          tilesPlaced: [
            { row: 7, col: 7, tile: 'C' },
            { row: 7, col: 8, tile: 'A' },
            { row: 7, col: 9, tile: 'T' },
          ],
        },
        {
          // Play XZ vertically through A - creates invalid word XAZ
          playerIndex: 1,
          tilesPlaced: [
            { row: 6, col: 8, tile: 'X' },
            { row: 8, col: 8, tile: 'Z' },
          ],
        },
      ])

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Challenge the move
      await gamePage.challengeMove('Bob', 0)

      // Wait for the success toast
      await expect(page.getByText(/Challenge successful/)).toBeVisible()

      // Bob's tiles should be removed but CAT should remain
      await gamePage.expectTileAt(7, 7, 'C')
      await gamePage.expectTileAt(7, 8, 'A')
      await gamePage.expectTileAt(7, 9, 'T')
      expect(await gamePage.cellHasTile(6, 8)).toBe(false)
      expect(await gamePage.cellHasTile(8, 8)).toBe(false)
    })
  })

  test.describe('Correct', () => {
    test('correct option available for all moves', async ({ page }) => {
      // Seed a game with two moves
      await seedGameWithMoves(page, ['Alice', 'Bob'], [
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

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Open menu on Alice's first move
      await gamePage.openMoveMenu('Alice', 0)
      await expect(page.getByRole('menuitem', { name: 'Correct' })).toBeVisible()
      await page.keyboard.press('Escape')

      // Open menu on Bob's move
      await gamePage.openMoveMenu('Bob', 0)
      await expect(page.getByRole('menuitem', { name: 'Correct' })).toBeVisible()
    })
  })

  test.describe('Pass moves', () => {
    test('pass moves do not show dropdown menu', async ({ page }) => {
      // Seed a game and play a pass move through UI
      await seedTwoPlayerGame(page, 'Alice', 'Bob')

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Play a word first (required for first move)
      await gamePage.placeWord(7, 7, 'CAT')
      await gamePage.endTurn()

      // Now pass for Bob
      await gamePage.endTurn()
      await gamePage.confirmPass()

      // Try to click on the pass entry
      const passEntry = page.locator('[role="region"][data-player]').filter({ hasText: 'Bob' }).locator('.divide-y > div').first()
      await passEntry.click()

      // No menu should appear (pass moves have no dropdown)
      await expect(page.getByRole('menuitem', { name: 'Correct' })).not.toBeVisible({ timeout: 500 })
      await expect(page.getByRole('menuitem', { name: 'Undo' })).not.toBeVisible({ timeout: 500 })
      await expect(page.getByRole('menuitem', { name: 'Challenge' })).not.toBeVisible({ timeout: 500 })
    })
  })
})
