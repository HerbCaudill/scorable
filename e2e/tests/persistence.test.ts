import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { PlayerSetupPage } from '../pages/player-setup.page'
import { GamePage } from '../pages/game.page'
import { clearStorage, getStorageState } from '../fixtures/storage-fixtures'

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

  // Reload page
  await page.reload()

  // Should have Resume Game option
  await expect(page.getByRole('button', { name: 'Resume game' })).toBeVisible()

  // Resume and verify state
  await homePage.clickResumeGame()

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

  // Verify storage
  const state = await getStorageState(page)
  expect(state.pastGames.length).toBe(1)
  expect(state.pastGames[0].status).toBe('finished')
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
  const state = await getStorageState(page)
  expect(state.pastGames.length).toBe(2)
})

test('current game replaces previous unfinished game', async ({ page }) => {
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

  // Go back to home and start new game
  await page.goto('/')
  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Charlie')
  await setupPage.addNewPlayer(1, 'Diana')
  await setupPage.startGame()

  // Current game should now be Charlie/Diana
  await expect(page.getByText('Charlie')).toBeVisible()
  await expect(page.getByText('Diana')).toBeVisible()

  // Verify in storage
  const state = await getStorageState(page)
  expect(state.currentGame).not.toBeNull()
  expect(state.currentGame?.players[0].name).toBe('Charlie')
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

  // Reload
  await page.reload()
  await homePage.clickResumeGame()

  // Timer should still be running (or at least time should have decreased)
  // Note: The timer running state may or may not persist depending on implementation
  // But the time remaining should have decreased
  const timerText = page.locator('.text-\\[10px\\]').first()
  const time = await timerText.textContent()
  expect(time).not.toBe('30:00') // Should be less than initial time
})
