import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { PlayerSetupPage } from '../pages/player-setup.page'
import { GamePage } from '../pages/game.page'
import { clearStorage } from '../fixtures/storage-fixtures'

let homePage: HomePage
let setupPage: PlayerSetupPage

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
  await page.reload()
  homePage = new HomePage(page)
  setupPage = new PlayerSetupPage(page)
  await homePage.clickNewGame()
})

test('Start Game button is disabled with less than 2 players', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Start game' })).toBeDisabled()
})

test('can add new players by name', async ({ page }) => {
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')

  await expect(page.getByText('1. Alice')).toBeVisible()
  await expect(page.getByText('2. Bob')).toBeVisible()
})

test('enables Start Game with 2+ players', async ({ page }) => {
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')

  await expect(page.getByRole('button', { name: 'Start game' })).toBeEnabled()
})

test('can select from previous players', async ({ page }) => {
  const gamePage = new GamePage(page)

  // First create a finished game to populate player records
  await setupPage.addNewPlayer(0, 'Charlie')
  await setupPage.addNewPlayer(1, 'Diana')
  await setupPage.startGame()

  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()
  await gamePage.clickEndGame()
  await gamePage.confirmEndGame()

  // Now start a new game
  await homePage.clickNewGame()

  // Open first player dropdown
  await setupPage.clickPlayerSlot(0)

  // Previous players should be visible
  await expect(page.getByRole('menuitem', { name: 'Charlie' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Diana' })).toBeVisible()
})

test('can clear a selected player', async ({ page }) => {
  await setupPage.addNewPlayer(0, 'Alice')
  await expect(page.getByText('1. Alice')).toBeVisible()

  await setupPage.clearPlayer(0)
  await expect(page.getByText('1. player name')).toBeVisible()
})

test('Back button returns to home', async ({ page }) => {
  await setupPage.goBack()

  await homePage.expectOnHomeScreen()
})

test('starts game and navigates to game screen', async ({ page }) => {
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.startGame()

  // Should see the game board
  await expect(page.getByRole('grid', { name: 'Scrabble board' })).toBeVisible()
})

test('can add up to 4 players', async ({ page }) => {
  await setupPage.addNewPlayer(0, 'Alice')
  await setupPage.addNewPlayer(1, 'Bob')
  await setupPage.addNewPlayer(2, 'Charlie')
  await setupPage.addNewPlayer(3, 'Diana')

  await expect(page.getByText('1. Alice')).toBeVisible()
  await expect(page.getByText('2. Bob')).toBeVisible()
  await expect(page.getByText('3. Charlie')).toBeVisible()
  await expect(page.getByText('4. Diana')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start game' })).toBeEnabled()
})

test('selected player is removed from other dropdowns', async ({ page }) => {
  const gamePage = new GamePage(page)

  // First create a finished game to populate player records
  await setupPage.addNewPlayer(0, 'Charlie')
  await setupPage.addNewPlayer(1, 'Diana')
  await setupPage.startGame()

  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()
  await gamePage.clickEndGame()
  await gamePage.confirmEndGame()

  // Now start a new game
  await homePage.clickNewGame()

  // Select Charlie for first slot
  await setupPage.selectExistingPlayer(0, 'Charlie')

  // Open second dropdown - Charlie should not be available
  await setupPage.clickPlayerSlot(1)
  await expect(page.getByRole('menuitem', { name: 'Diana' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Charlie' })).not.toBeVisible()
})
