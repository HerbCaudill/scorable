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

test('complete game from start to finish', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  // Start new game
  await homePage.clickNewGame()

  // Add players
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Verify game started
  await gamePage.expectOnGameScreen()
  await gamePage.expectPlayerName('Alice')
  await gamePage.expectPlayerName('Bob')

  // Verify initial scores are 0
  expect(await gamePage.getPlayerScore(0)).toBe(0)
  expect(await gamePage.getPlayerScore(1)).toBe(0)

  // Verify Alice (player 0) is the current player
  expect(await gamePage.getCurrentPlayerIndex()).toBe(0)

  // Alice places first word "CAT" at center (7,7)
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Verify score updated (C=3, A=1, T=1 = 5 * 2 for center DW = 10)
  expect(await gamePage.getPlayerScore(0)).toBe(10)

  // Verify turn changed to Bob
  expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

  // Bob extends word by placing "S" below "A" to make "AS"
  await gamePage.clickCell(8, 8)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // Verify Bob got points
  const bobScore = await gamePage.getPlayerScore(1)
  expect(bobScore).toBeGreaterThan(0)

  // Verify turn changed back to Alice
  expect(await gamePage.getCurrentPlayerIndex()).toBe(0)

  // End game
  await gamePage.clickEndGame()
  await gamePage.confirmEndGame()

  // Should return to home screen
  await homePage.expectOnHomeScreen()

  // Past games section should be visible
  await expect(page.getByText('Past games')).toBeVisible()
})

test('turn advances correctly in 3-player game', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.addNewPlayer(2, 'Charlie')
  await setupPage.startGame()

  // Alice's turn (0)
  expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Bob's turn (1)
  expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
  await gamePage.clickCell(8, 8)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // Charlie's turn (2)
  expect(await gamePage.getCurrentPlayerIndex()).toBe(2)
  await gamePage.clickCell(7, 6)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // Back to Alice (0)
  expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
})

test('scores accumulate across multiple turns', async ({ page }) => {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Alice places "CAT" at center
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()
  const aliceScoreAfterFirst = await gamePage.getPlayerScore(0)
  expect(aliceScoreAfterFirst).toBe(10)

  // Bob extends
  await gamePage.clickCell(8, 8)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // Alice extends with another word
  await gamePage.clickCell(7, 10)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // Alice's score should have increased
  const aliceScoreAfterSecond = await gamePage.getPlayerScore(0)
  expect(aliceScoreAfterSecond).toBeGreaterThan(aliceScoreAfterFirst)
})
