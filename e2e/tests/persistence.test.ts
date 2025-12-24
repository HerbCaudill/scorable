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

test('game state persists across page reload', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Start a game
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Place a word
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Verify score
  expect(await gamePage.getPlayerScore(0)).toBe(10)

  // Wait for IndexedDB to flush before reload
  await page.waitForTimeout(500)

  // Reload page - game should auto-resume via URL hash
  await page.reload()

  // Wait for Automerge to reload from IndexedDB
  await page.waitForTimeout(1000)

  // Game screen should still be visible (auto-navigated via URL hash)
  await gamePage.expectOnGameScreen()

  // CAT should still be on board
  await gamePage.expectTileAt(7, 7, 'C')
  await gamePage.expectTileAt(7, 8, 'A')
  await gamePage.expectTileAt(7, 9, 'T')

  // Score should be preserved
  expect(await gamePage.getPlayerScore(0)).toBe(10)

  // Should be Bob's turn
  expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
})

test('player records persist for autocomplete', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Create and finish a game with specific players
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'TestPlayer1')
  await setupPage.addNewPlayer(1, 'TestPlayer2')
  await setupPage.startGame()

  // Play a quick move
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // End game
  await gamePage.clickEndGame()
  await gamePage.confirmEndGame()

  // Start new game
  await homePage.clickNewGame()

  // Open first player dropdown - previous players should be available
  await setupPage.clickPlayerSlot(0)
  await expect(page.getByRole('menuitem', { name: 'TestPlayer1' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'TestPlayer2' })).toBeVisible()
})

test('finished games appear in past games list', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Start and finish a game
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  await gamePage.clickEndGame()
  await gamePage.confirmEndGame()

  // Past games section should be visible
  await expect(page.getByText('Past games')).toBeVisible()

  // Verify past game count via UI
  const count = await homePage.getPastGamesCount()
  expect(count).toBe(1)
})

test('multiple games accumulate in history', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Play first game
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()
  await gamePage.clickEndGame()
  await gamePage.confirmEndGame()

  // Play second game
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Charlie')
  await setupPage.addNewPlayer(1, 'Diana')
  await setupPage.startGame()
  await gamePage.placeWord(7, 7, 'DOG')
  await gamePage.endTurn()
  await gamePage.clickEndGame()
  await gamePage.confirmEndGame()

  // Should have 2 past games
  const count = await homePage.getPastGamesCount()
  expect(count).toBe(2)
})

test('active game shown on home screen after navigating away', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Start first game (don't finish)
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Navigate to home by clearing hash
  await page.evaluate(() => {
    window.location.hash = ''
  })
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible()

  // Active games section should show the game
  await expect(page.getByText('Active games')).toBeVisible()
  await expect(page.getByText('Alice')).toBeVisible()
  await expect(page.getByText('Bob')).toBeVisible()
})

test('timer state persists across reload', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Start game and start timer
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  await gamePage.toggleTimer() // Start timer
  await page.waitForTimeout(1000)

  // Get time before reload
  const timerBefore = gamePage.getPlayerTimer(0)
  const timeBefore = await timerBefore.getAttribute('aria-label')

  // Reload - game auto-resumes via URL hash
  await page.reload()
  await gamePage.expectOnGameScreen()

  // The time remaining should have been persisted (though timer running state may reset)
  const timerAfter = gamePage.getPlayerTimer(0)
  const timeAfter = await timerAfter.getAttribute('aria-label')

  // Time should be less than or equal to initial 30:00
  expect(timeAfter).not.toBe('30:00 remaining')
})
