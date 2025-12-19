import { test, expect } from '@playwright/test'
import { GamePage } from '../pages/game.page'
import { clearStorage, seedStorage } from '../fixtures/storage-fixtures'
import { createTestGame, createGameWithMoves } from '../fixtures/game-fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
})

test('shows confirmation dialog when passing with no tiles', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Press Enter without placing tiles
  await gamePage.clickCell(7, 7) // Need to focus the board first
  await gamePage.endTurn()

  // Should show pass confirmation
  await gamePage.expectDialogWithTitle('Pass turn?')
})

test('confirming pass advances turn', async ({ page }) => {
  // Need an existing game so it's not the first move
  const gameWithMove = createGameWithMoves(['Alice', 'Bob'], [
    {
      playerIndex: 0,
      tilesPlaced: [
        { row: 7, col: 7, tile: 'C' },
        { row: 7, col: 8, tile: 'A' },
        { row: 7, col: 9, tile: 'T' },
      ],
    },
  ])

  await seedStorage(page, { currentGame: gameWithMove })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Bob's turn (index 1)
  expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

  // Pass turn
  await gamePage.clickCell(0, 0) // Focus board
  await gamePage.endTurn()
  await gamePage.confirmPass()

  // Should now be Alice's turn (index 0)
  expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
})

test('canceling pass dialog keeps same player', async ({ page }) => {
  const gameWithMove = createGameWithMoves(['Alice', 'Bob'], [
    {
      playerIndex: 0,
      tilesPlaced: [
        { row: 7, col: 7, tile: 'C' },
        { row: 7, col: 8, tile: 'A' },
        { row: 7, col: 9, tile: 'T' },
      ],
    },
  ])

  await seedStorage(page, { currentGame: gameWithMove })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Bob's turn (index 1)
  expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

  // Try to pass but cancel
  await gamePage.clickCell(0, 0)
  await gamePage.endTurn()
  await gamePage.cancelDialog()

  // Should still be Bob's turn
  expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
})

test('passing does not change score', async ({ page }) => {
  const gameWithMove = createGameWithMoves(['Alice', 'Bob'], [
    {
      playerIndex: 0,
      tilesPlaced: [
        { row: 7, col: 7, tile: 'C' },
        { row: 7, col: 8, tile: 'A' },
        { row: 7, col: 9, tile: 'T' },
      ],
    },
  ])

  await seedStorage(page, { currentGame: gameWithMove })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  const scoreBefore = await gamePage.getPlayerScore(1)

  // Pass turn
  await gamePage.clickCell(0, 0)
  await gamePage.endTurn()
  await gamePage.confirmPass()

  // After passing, check score on next turn
  await gamePage.clickCell(0, 0)
  await gamePage.endTurn()
  await gamePage.confirmPass()

  // Bob's score should still be 0
  const scoreAfter = await gamePage.getPlayerScore(1)
  expect(scoreAfter).toBe(scoreBefore)
})

test('pass is recorded in move history', async ({ page }) => {
  const gameWithMove = createGameWithMoves(['Alice', 'Bob'], [
    {
      playerIndex: 0,
      tilesPlaced: [
        { row: 7, col: 7, tile: 'C' },
        { row: 7, col: 8, tile: 'A' },
        { row: 7, col: 9, tile: 'T' },
      ],
    },
  ])

  await seedStorage(page, { currentGame: gameWithMove })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Bob passes
  await gamePage.clickCell(0, 0)
  await gamePage.endTurn()
  await gamePage.confirmPass()

  // "(pass)" should appear in move history
  await expect(page.getByText('(pass)')).toBeVisible()
})

test('clicking player panel without tiles shows pass dialog', async ({ page }) => {
  const gameWithMove = createGameWithMoves(['Alice', 'Bob'], [
    {
      playerIndex: 0,
      tilesPlaced: [
        { row: 7, col: 7, tile: 'C' },
        { row: 7, col: 8, tile: 'A' },
        { row: 7, col: 9, tile: 'T' },
      ],
    },
  ])

  await seedStorage(page, { currentGame: gameWithMove })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Click on the next player's panel (or current player's panel) to end turn
  await gamePage.clickPlayerPanel(0) // Click Alice's panel (next player)

  // Should show pass confirmation
  await gamePage.expectDialogWithTitle('Pass turn?')
})
