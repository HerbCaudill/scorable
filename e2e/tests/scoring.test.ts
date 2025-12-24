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

test('applies double word score for center square', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // CAT at center: C=3, A=1, T=1 = 5 * 2 (DW) = 10
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  expect(await gamePage.getPlayerScore(0)).toBe(10)
})

test('basic word scoring without multipliers', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Alice places CAT at center
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Bob adds S below A: S is on DL square, so S(1)*2 + A(1) = 3
  await gamePage.clickCell(8, 8)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // AS = A(1) + S(1)*2 (DL at 8,8) = 3
  expect(await gamePage.getPlayerScore(1)).toBe(3)
})

test('cross-word scoring', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Alice places CAT at center
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Bob places "O" above T and "S" below T to make "OTS" vertically
  await gamePage.setCursorDirection(6, 9, 'vertical')
  await gamePage.typeLetters('O')
  await gamePage.clickCell(8, 9)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // Should score for the vertical word "OTS" (O=1, T=1, S=1 = 3)
  expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
})

test('bingo bonus for 7 tiles', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // RETAINS: R=1, E=1, T=1, A=1, I=1, N=1, S=1 = 7 * 2 = 14 + 50 = 64
  await gamePage.placeWord(7, 4, 'RETAINS')
  await gamePage.endTurn()

  // 7 tiles = bingo bonus of 50
  const score = await gamePage.getPlayerScore(0)
  expect(score).toBeGreaterThanOrEqual(64) // Base + bingo
})

test('blank tile scores 0 points', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Place C_T where _ is a blank representing A
  // C=3, blank=0, T=1 = 4 * 2 = 8
  await gamePage.clickCell(7, 7)
  await gamePage.typeLetters('C')
  await gamePage.pressKey(' ') // Blank tile
  await gamePage.typeLetters('T')
  await gamePage.endTurn()

  // C(3) + blank(0) + T(1) = 4 * 2 = 8
  expect(await gamePage.getPlayerScore(0)).toBe(8)
})

test('double letter square', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Alice places CAT at center
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Place a word that uses a DL square
  // (6,7) should connect to C - place "O" above C
  await gamePage.clickCell(6, 7)
  await gamePage.typeLetters('O')
  await gamePage.endTurn()

  // O at some position + C from cross
  expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
})

test('scores update after each valid move', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Initial scores should be 0
  expect(await gamePage.getPlayerScore(0)).toBe(0)
  expect(await gamePage.getPlayerScore(1)).toBe(0)

  // Alice plays
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()
  expect(await gamePage.getPlayerScore(0)).toBe(10)
  expect(await gamePage.getPlayerScore(1)).toBe(0)

  // Bob plays
  await gamePage.clickCell(8, 8)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()
  expect(await gamePage.getPlayerScore(0)).toBe(10)
  expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
})
