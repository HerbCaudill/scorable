import { test, expect } from '@playwright/test'
import { GamePage } from '../pages/game.page'
import { clearStorage, seedStorage } from '../fixtures/storage-fixtures'
import { createTestGame } from '../fixtures/game-fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()
})

test('timer starts when Start Timer clicked', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Initially should show "Start timer"
  await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()

  // Start timer
  await gamePage.toggleTimer()

  // Should now show "Pause timer"
  await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible()
})

test('timer pauses when Pause Timer clicked', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer
  await gamePage.toggleTimer()
  await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible()

  // Pause timer
  await gamePage.toggleTimer()

  // Should show "Start timer" again
  await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()
})

test('timer countdown decrements over time', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Get initial time display from the timer element
  const timer = gamePage.getPlayerTimer(0)
  const initialLabel = await timer.getAttribute('aria-label')

  // Start timer and wait
  await gamePage.toggleTimer()
  await page.waitForTimeout(1500)

  // Time should have decreased
  const newLabel = await timer.getAttribute('aria-label')
  expect(newLabel).not.toBe(initialLabel)
})

test('timer pauses during moves', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer
  await gamePage.toggleTimer()

  // Get time before pause
  const timer = gamePage.getPlayerTimer(0)
  await page.waitForTimeout(500)
  const labelBeforePause = await timer.getAttribute('aria-label')

  // Pause timer
  await gamePage.toggleTimer()

  // Wait a bit
  await page.waitForTimeout(1000)

  // Time should not have changed
  const labelAfterPause = await timer.getAttribute('aria-label')
  expect(labelAfterPause).toBe(labelBeforePause)
})

test('timer continues for next player after turn', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Start timer
  await gamePage.toggleTimer()
  await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible()

  // Make a move
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Timer should still be running (now for Bob)
  await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible()
})

test('each player has independent timer', async ({ page }) => {
  const gamePage = new GamePage(page)

  // Get initial times for both players
  const aliceTimer = gamePage.getPlayerTimer(0)
  const bobTimer = gamePage.getPlayerTimer(1)
  const aliceInitialLabel = await aliceTimer.getAttribute('aria-label')
  const bobInitialLabel = await bobTimer.getAttribute('aria-label')

  // Start timer (Alice's turn)
  await gamePage.toggleTimer()
  await page.waitForTimeout(1500)

  // Alice's time should have decreased, Bob's should be the same
  const aliceLabelAfter = await aliceTimer.getAttribute('aria-label')
  const bobLabelAfter = await bobTimer.getAttribute('aria-label')

  expect(aliceLabelAfter).not.toBe(aliceInitialLabel)
  expect(bobLabelAfter).toBe(bobInitialLabel)
})
