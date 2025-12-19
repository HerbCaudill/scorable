import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { PastGamePage } from '../pages/past-game.page'
import { GamePage } from '../pages/game.page'
import { clearStorage, seedStorage } from '../fixtures/storage-fixtures'
import { createFinishedGame } from '../fixtures/game-fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
})

test('can view past game details', async ({ page }) => {
  const finishedGame = createFinishedGame(['Alice', 'Bob'])

  await seedStorage(page, { pastGames: [finishedGame] })
  await page.reload()

  const homePage = new HomePage(page)
  await homePage.clickPastGame(0)

  const pastGamePage = new PastGamePage(page)
  await pastGamePage.expectOnPastGameScreen()

  // Should see player names
  await pastGamePage.expectPlayerName('Alice')
  await pastGamePage.expectPlayerName('Bob')
})

test('past game board shows tiles', async ({ page }) => {
  const finishedGame = createFinishedGame(['Alice', 'Bob'])

  await seedStorage(page, { pastGames: [finishedGame] })
  await page.reload()

  const homePage = new HomePage(page)
  await homePage.clickPastGame(0)

  // The finished game has CAT at center
  const gamePage = new GamePage(page)
  await gamePage.expectTileAt(7, 7, 'C')
  await gamePage.expectTileAt(7, 8, 'A')
  await gamePage.expectTileAt(7, 9, 'T')
})

test('past game board is read-only', async ({ page }) => {
  const finishedGame = createFinishedGame(['Alice', 'Bob'])

  await seedStorage(page, { pastGames: [finishedGame] })
  await page.reload()

  const homePage = new HomePage(page)
  await homePage.clickPastGame(0)

  // Try clicking a cell - should not show cursor
  const cell = page.locator('.grid-cols-15 > div').nth(0)
  await cell.click()

  // No cursor ring should appear
  await expect(cell.locator('.ring-teal-600')).not.toBeVisible()

  // Try typing - should not place tile
  await page.keyboard.type('X')
  await expect(cell).not.toContainText('X')
})

test('back button returns to home', async ({ page }) => {
  const finishedGame = createFinishedGame(['Alice', 'Bob'])

  await seedStorage(page, { pastGames: [finishedGame] })
  await page.reload()

  const homePage = new HomePage(page)
  await homePage.clickPastGame(0)

  const pastGamePage = new PastGamePage(page)
  await pastGamePage.goBack()

  await homePage.expectOnHomeScreen()
})

test('shows scores for each player', async ({ page }) => {
  const finishedGame = createFinishedGame(['Alice', 'Bob'])

  await seedStorage(page, { pastGames: [finishedGame] })
  await page.reload()

  const homePage = new HomePage(page)
  await homePage.clickPastGame(0)

  const pastGamePage = new PastGamePage(page)

  // Scores should be visible (both should have scored)
  const aliceScore = await pastGamePage.getPlayerScore(0)
  const bobScore = await pastGamePage.getPlayerScore(1)

  expect(aliceScore).toBeGreaterThan(0)
  expect(bobScore).toBeGreaterThan(0)
})

test('past games show winner indicator on home screen', async ({ page }) => {
  const finishedGame = createFinishedGame(['Alice', 'Bob'])

  await seedStorage(page, { pastGames: [finishedGame] })
  await page.reload()

  // The trophy icon should be visible next to the winner
  // The winning player should have a trophy icon
  await expect(page.locator('.text-amber-500')).toBeVisible()
})

test('multiple past games are listed', async ({ page }) => {
  const game1 = createFinishedGame(['Alice', 'Bob'])
  const game2 = createFinishedGame(['Charlie', 'Diana'])

  await seedStorage(page, { pastGames: [game1, game2] })
  await page.reload()

  const homePage = new HomePage(page)
  const count = await homePage.getPastGamesCount()
  expect(count).toBe(2)
})

test('can navigate between different past games', async ({ page }) => {
  const game1 = createFinishedGame(['Alice', 'Bob'])
  const game2 = createFinishedGame(['Charlie', 'Diana'])

  await seedStorage(page, { pastGames: [game1, game2] })
  await page.reload()

  const homePage = new HomePage(page)
  const pastGamePage = new PastGamePage(page)

  // View first game
  await homePage.clickPastGame(0)
  await pastGamePage.expectPlayerName('Alice')
  await pastGamePage.goBack()

  // View second game
  await homePage.clickPastGame(1)
  await pastGamePage.expectPlayerName('Charlie')
})
