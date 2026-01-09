import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { PlayerSetupPage } from '../pages/player-setup.page'
import { GamePage } from '../pages/game.page'
import { clearStorage } from '../fixtures/storage-fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
  await page.reload()

  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()
})

test('timers are hidden until first started', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Timer elements should not be visible initially
  const aliceTimer = gamePage.getPlayerTimer(0)
  const bobTimer = gamePage.getPlayerTimer(1)
  await expect(aliceTimer).not.toBeVisible()
  await expect(bobTimer).not.toBeVisible()

  // Start timer
  await gamePage.toggleTimer()

  // Now timers should be visible
  await expect(aliceTimer).toBeVisible()
  await expect(bobTimer).toBeVisible()
})

test('timers stay visible after pausing', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer
  await gamePage.toggleTimer()

  // Pause timer
  await gamePage.toggleTimer()

  // Timers should still be visible
  const aliceTimer = gamePage.getPlayerTimer(0)
  const bobTimer = gamePage.getPlayerTimer(1)
  await expect(aliceTimer).toBeVisible()
  await expect(bobTimer).toBeVisible()
})

test('timer starts when Start Timer clicked', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Initially should show "Timer" button (timer never used)
  await expect(page.getByRole('button', { name: 'Timer' })).toBeVisible()

  // Start timer
  await gamePage.toggleTimer()

  // Should now show "Pause" button
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
})

test('timer pauses when Pause Timer clicked', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer
  await gamePage.toggleTimer()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

  // Pause timer
  await gamePage.toggleTimer()

  // Should show "Resume" button
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
})

test('timer countdown decrements over time', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer first (timers are hidden until started)
  await gamePage.toggleTimer()

  // Get initial time display from the timer element
  const timer = gamePage.getPlayerTimer(0)
  const initialLabel = await timer.getAttribute('aria-label')

  // Wait for time to decrease
  await page.waitForTimeout(1500)

  // Time should have decreased
  const newLabel = await timer.getAttribute('aria-label')
  expect(newLabel).not.toBe(initialLabel)
})

test('timer pauses during moves', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer
  await gamePage.toggleTimer()

  // Let timer run a bit
  await page.waitForTimeout(500)

  // Pause timer
  await gamePage.toggleTimer()

  // Get time immediately after pause
  const timer = gamePage.getPlayerTimer(0)
  const labelAfterPause = await timer.getAttribute('aria-label')

  // Wait a bit
  await page.waitForTimeout(1000)

  // Time should not have changed while paused
  const labelAfterWait = await timer.getAttribute('aria-label')
  expect(labelAfterWait).toBe(labelAfterPause)
})

test('timer continues for next player after turn', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer
  await gamePage.toggleTimer()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

  // Make a move
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Timer should still be running (now for Bob)
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
})

test('each player has independent timer', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer first (timers are hidden until started)
  await gamePage.toggleTimer()

  // Get initial times for both players
  const aliceTimer = gamePage.getPlayerTimer(0)
  const bobTimer = gamePage.getPlayerTimer(1)
  const aliceInitialLabel = await aliceTimer.getAttribute('aria-label')
  const bobInitialLabel = await bobTimer.getAttribute('aria-label')

  // Wait for time to decrease (Alice's turn)
  await page.waitForTimeout(1500)

  // Alice's time should have decreased, Bob's should be the same
  const aliceLabelAfter = await aliceTimer.getAttribute('aria-label')
  const bobLabelAfter = await bobTimer.getAttribute('aria-label')

  expect(aliceLabelAfter).not.toBe(aliceInitialLabel)
  expect(bobLabelAfter).toBe(bobInitialLabel)
})

test('board is editable while timer is running', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer
  await gamePage.toggleTimer()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

  // Wait for timer to run for a bit (several interval ticks)
  await page.waitForTimeout(500)

  // Try to place a word on the board - typing multiple letters tests that
  // the timer interval doesn't steal focus away from the board
  await gamePage.clickCell(7, 7)
  await gamePage.expectCellSelected(7, 7)

  // Type a word slowly to ensure timer interval has time to fire between keystrokes
  await page.keyboard.type('CAT', { delay: 150 })

  // All tiles should be placed
  await gamePage.expectTileAt(7, 7, 'C')
  await gamePage.expectTileAt(7, 8, 'A')
  await gamePage.expectTileAt(7, 9, 'T')
})
