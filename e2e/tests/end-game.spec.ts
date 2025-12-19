import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { GamePage } from '../pages/game.page'
import { seedStorage, clearStorage } from '../fixtures/storage-fixtures'
import { createNearEndGame } from '../fixtures/game-fixtures'

test.describe('End Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearStorage(page)

    // Seed a game near end
    const game = createNearEndGame(['Alice', 'Bob'])
    await seedStorage(page, { currentGame: game })
    await page.reload()

    // Resume the game
    const homePage = new HomePage(page)
    await homePage.clickResumeGame()
  })

  test('shows EndGameScreen when tiles <= threshold', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.expectOnGameScreen()

    // Click End Game - should show EndGameScreen, not simple dialog
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()
  })

  test('defaults to last player as who ended the game', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Last move was by Alice (playerIndex 0), so Alice should be shown as "ended the game"
    await gamePage.expectPlayerEndedGame('Alice')
  })

  test('can change who ended the game', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Change to Bob
    await gamePage.selectPlayerWhoEndedGame('Bob')
    await gamePage.expectPlayerEndedGame('Bob')
  })

  test('can select nobody for blocked game', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    await gamePage.selectNobodyEndedGame()

    // Neither player should show "ended the game"
    const aliceSection = page.locator('.rounded-lg.border.p-3').filter({ hasText: 'Alice' })
    const bobSection = page.locator('.rounded-lg.border.p-3').filter({ hasText: 'Bob' })
    await expect(aliceSection).not.toContainText('ended the game')
    await expect(bobSection).not.toContainText('ended the game')
  })

  test('can enter rack tiles and see deduction', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Alice ended the game, enter tiles for Bob
    await gamePage.enterRackTiles('Bob', 'QZ')

    // Q=10, Z=10 = -20 deduction
    const adjustment = await gamePage.getPlayerAdjustment('Bob')
    expect(adjustment).toBe('-20')
  })

  test('player who ended game gets bonus', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Alice ended the game, enter tiles for Bob
    await gamePage.enterRackTiles('Bob', 'QZ')

    // Alice should get +20 bonus (Bob's tiles)
    const aliceAdjustment = await gamePage.getPlayerAdjustment('Alice')
    expect(aliceAdjustment).toBe('+20')
  })

  test('validates rack tiles against remaining', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Try to enter too many Q tiles (only 1 Q in distribution)
    await gamePage.enterRackTiles('Bob', 'QQ')

    // Should show error
    await gamePage.expectRackError('Bob', 'Too many Q')

    // Apply button should be disabled
    expect(await gamePage.isApplyButtonDisabled()).toBe(true)
  })

  test('can cancel and return to game', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    await gamePage.cancelEndGame()
    await gamePage.expectOnGameScreen()
  })

  test('apply creates adjustment moves and ends game', async ({ page }) => {
    const gamePage = new GamePage(page)
    const homePage = new HomePage(page)

    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Alice ended, Bob has QZ (20 points)
    await gamePage.enterRackTiles('Bob', 'QZ')
    await gamePage.applyAndEndGame()

    // Should return to home screen
    await homePage.expectOnHomeScreen()
  })

  test('backspace removes tiles from rack input', async ({ page }) => {
    const gamePage = new GamePage(page)
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Enter QZ, then remove one
    await gamePage.enterRackTiles('Bob', 'QZ')
    let adjustment = await gamePage.getPlayerAdjustment('Bob')
    expect(adjustment).toBe('-20') // Q=10, Z=10

    await gamePage.clearRackTiles('Bob', 1)
    adjustment = await gamePage.getPlayerAdjustment('Bob')
    expect(adjustment).toBe('-10') // Just Q=10
  })
})
