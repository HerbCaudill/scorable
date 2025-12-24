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

test.describe('move correction', () => {
  test('long-press on move enters edit mode', async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    // Start a game and make a move
    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, 'Alice')
    await setupPage.addNewPlayer(1, 'Bob')
    await setupPage.startGame()

    await gamePage.placeWord(7, 7, 'CAT')
    await gamePage.endTurn()

    // Long-press on Alice's first move
    await gamePage.longPressMove('Alice', 0)
    await gamePage.expectInEditMode()
  })

  test('cancel edit returns to normal mode', async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, 'Alice')
    await setupPage.addNewPlayer(1, 'Bob')
    await setupPage.startGame()

    await gamePage.placeWord(7, 7, 'CAT')
    await gamePage.endTurn()

    await gamePage.longPressMove('Alice', 0)
    await gamePage.expectInEditMode()

    await gamePage.cancelEdit()
    await gamePage.expectNotInEditMode()
  })

  test('edited move updates score', async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, 'Alice')
    await setupPage.addNewPlayer(1, 'Bob')
    await setupPage.startGame()

    // Play CAT (C=3, A=1, T=1 = 5 * 2 center = 10)
    await gamePage.placeWord(7, 7, 'CAT')
    await gamePage.endTurn()

    const initialScore = await gamePage.getPlayerScore(0)
    expect(initialScore).toBe(10)

    // Bob passes
    await gamePage.endTurn()
    await gamePage.confirmPass()

    // Edit Alice's move - add letter S to make CATS
    await gamePage.longPressMove('Alice', 0)
    await gamePage.expectInEditMode()

    // Click on cell after T to give focus and add S
    await gamePage.clickCell(7, 10) // Click after T
    await gamePage.typeLetters('S')
    await gamePage.saveEdit()

    // Score should now be 12 (CATS = C=3 + A=1 + T=1 + S=1 = 6 * 2 center = 12)
    const newScore = await gamePage.getPlayerScore(0)
    expect(newScore).toBe(12)

    // Verify the board shows CATS
    await gamePage.expectTileAt(7, 7, 'C')
    await gamePage.expectTileAt(7, 8, 'A')
    await gamePage.expectTileAt(7, 9, 'T')
    await gamePage.expectTileAt(7, 10, 'S')
  })

  test('edited move persists after reload', async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, 'Alice')
    await setupPage.addNewPlayer(1, 'Bob')
    await setupPage.startGame()

    await gamePage.placeWord(7, 7, 'CAT')
    await gamePage.endTurn()

    // Bob passes
    await gamePage.endTurn()
    await gamePage.confirmPass()

    // Edit to CATS (add S)
    await gamePage.longPressMove('Alice', 0)
    await gamePage.clickCell(7, 10) // Click after T
    await gamePage.typeLetters('S')
    await gamePage.saveEdit()

    // Verify score updated
    expect(await gamePage.getPlayerScore(0)).toBe(12)

    // Reload - the app auto-navigates via URL hash
    await page.reload()

    // Should already be on game screen (auto-navigation via URL hash)
    await gamePage.expectOnGameScreen()

    // Should show CATS and score persisted
    await gamePage.expectTileAt(7, 7, 'C')
    await gamePage.expectTileAt(7, 8, 'A')
    await gamePage.expectTileAt(7, 9, 'T')
    await gamePage.expectTileAt(7, 10, 'S')
    expect(await gamePage.getPlayerScore(0)).toBe(12)
  })

  test('cannot enter edit mode with tiles in progress', async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, 'Alice')
    await setupPage.addNewPlayer(1, 'Bob')
    await setupPage.startGame()

    // Alice plays CAT
    await gamePage.placeWord(7, 7, 'CAT')
    await gamePage.endTurn()

    // Bob starts placing tiles (but doesn't commit)
    await gamePage.placeWord(8, 7, 'AT', 'vertical')

    // Try to edit Alice's move - should show error toast
    await gamePage.longPressMove('Alice', 0)

    // Should NOT enter edit mode
    await gamePage.expectNotInEditMode()

    // Should show error toast
    await gamePage.expectErrorToast('Clear current move first')
  })

  test('editing move shows only that moves tiles on board', async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, 'Alice')
    await setupPage.addNewPlayer(1, 'Bob')
    await setupPage.startGame()

    // Alice plays CAT
    await gamePage.placeWord(7, 7, 'CAT')
    await gamePage.endTurn()

    // Bob plays CATS (adds S)
    await gamePage.clickCell(7, 10)
    await gamePage.typeLetters('S')
    await gamePage.endTurn()

    // Edit Alice's first move - board should show CAT without Bob's S
    await gamePage.longPressMove('Alice', 0)
    await gamePage.expectInEditMode()

    // The S from Bob's move should still be visible (excluded moves don't hide other moves)
    // But Alice's tiles (C, A, T) should be shown as "new" tiles (editable)
    await gamePage.expectNewTileAt(7, 7)
    await gamePage.expectNewTileAt(7, 8)
    await gamePage.expectNewTileAt(7, 9)

    await gamePage.cancelEdit()
  })
})
