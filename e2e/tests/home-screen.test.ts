import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { clearStorage, seedStorage } from '../fixtures/storage-fixtures'
import { createTestGame, createFinishedGame } from '../fixtures/game-fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
  await page.reload()
})

test('shows New Game button', async ({ page }) => {
  const homePage = new HomePage(page)
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible()
})

test('does not show Resume Game when no active game', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Resume game' })).not.toBeVisible()
})

test('shows Resume Game when active game exists', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()

  await expect(page.getByRole('button', { name: 'Resume game' })).toBeVisible()
})

test('navigates to player setup on New Game click', async ({ page }) => {
  const homePage = new HomePage(page)
  await homePage.clickNewGame()

  await expect(page.getByRole('button', { name: 'Start game' })).toBeVisible()
})

test('shows past games section when games exist', async ({ page }) => {
  await seedStorage(page, {
    pastGames: [createFinishedGame(['Alice', 'Bob'])],
  })
  await page.reload()

  await expect(page.getByText('Past games')).toBeVisible()
})

test('navigates to past game on click', async ({ page }) => {
  const finishedGame = createFinishedGame(['Alice', 'Bob'])
  await seedStorage(page, { pastGames: [finishedGame] })
  await page.reload()

  const homePage = new HomePage(page)
  await homePage.clickPastGame(0)

  // Should see the past game view with Back button
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
})

test('resumes game when Resume Game clicked', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()

  const homePage = new HomePage(page)
  await homePage.clickResumeGame()

  // Should see the game screen with the board
  await expect(page.getByRole('grid', { name: 'Scrabble board' })).toBeVisible()
  await expect(page.getByText('Alice')).toBeVisible()
  await expect(page.getByText('Bob')).toBeVisible()
})
