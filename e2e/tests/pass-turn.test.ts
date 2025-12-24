import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { PlayerSetupPage } from '../pages/player-setup.page'
import { GamePage } from '../pages/game.page'
import { clearStorage } from '../fixtures/storage-fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
  await page.reload()
})

test('shows confirmation dialog when passing with no tiles', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Create a game
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Press Enter without placing tiles
  await gamePage.clickCell(7, 7) // Need to focus the board first
  await gamePage.endTurn()

  // Should show pass confirmation
  await gamePage.expectDialogWithTitle('Pass turn?')
})

test('confirming pass advances turn', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Create a game and make first move
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Alice places first word
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

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
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Create a game and make first move
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Alice places first word
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

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
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Create a game and make first move
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Alice places first word
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

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
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Create a game and make first move
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Alice places first word
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Bob passes
  await gamePage.clickCell(0, 0)
  await gamePage.endTurn()
  await gamePage.confirmPass()

  // "(pass)" should appear in move history
  await expect(page.getByText('(pass)')).toBeVisible()
})

test('clicking player panel without tiles shows pass dialog', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Create a game and make first move
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Alice places first word
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Click on the next player's panel (or current player's panel) to end turn
  await gamePage.clickPlayerPanel(0) // Click Alice's panel (next player)

  // Should show pass confirmation
  await gamePage.expectDialogWithTitle('Pass turn?')
})
