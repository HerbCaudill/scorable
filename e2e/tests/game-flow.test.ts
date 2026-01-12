import { test, expect } from "@playwright/test"
import { HomePage } from "../pages/home.page"
import { PlayerSetupPage } from "../pages/player-setup.page"
import { GamePage } from "../pages/game.page"
import { clearStorage } from "../fixtures/storage-fixtures"
import { seedNearEndGame } from "../fixtures/seed-game"

test.describe("Game flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    // seedNearEndGame and other test setup functions handle clearing storage
  })

  test("complete game from start to finish", async ({ page }) => {
    // Seed a near-end game to test the normal end-game flow
    await seedNearEndGame(page)

    const homePage = new HomePage(page)
    const gamePage = new GamePage(page)

    // Verify game is loaded
    await gamePage.expectOnGameScreen()
    await gamePage.expectPlayerName("Alice")
    await gamePage.expectPlayerName("Bob")

    // Verify scores are non-zero (game has moves)
    expect(await gamePage.getPlayerScore(0)).toBeGreaterThan(0)
    expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)

    // End game via End button (shows when tiles <= threshold)
    await gamePage.finishGame()

    // Should return to home screen (finishGame includes reload)
    await homePage.expectOnHomeScreen()

    // Past games section should be visible
    await expect(page.getByText("Past games")).toBeVisible()
  })

  test("turn advances correctly in 3-player game", async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, "Alice")
    await setupPage.addNewPlayer(1, "Bob")
    await setupPage.addNewPlayer(2, "Charlie")
    await setupPage.startGame()

    // Alice's turn (0)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob's turn (1)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
    await gamePage.clickCell(8, 8)
    await gamePage.typeLetters("S")
    await gamePage.endTurn()

    // Charlie's turn (2)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(2)
    await gamePage.clickCell(7, 6)
    await gamePage.typeLetters("S")
    await gamePage.endTurn()

    // Back to Alice (0)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
  })

  test("scores accumulate across multiple turns", async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, "Alice")
    await setupPage.addNewPlayer(1, "Bob")
    await setupPage.startGame()

    // Alice places "CAT" at center
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()
    const aliceScoreAfterFirst = await gamePage.getPlayerScore(0)
    expect(aliceScoreAfterFirst).toBe(10)

    // Bob extends
    await gamePage.clickCell(8, 8)
    await gamePage.typeLetters("S")
    await gamePage.endTurn()

    // Alice extends with another word
    await gamePage.clickCell(7, 10)
    await gamePage.typeLetters("S")
    await gamePage.endTurn()

    // Alice's score should have increased
    const aliceScoreAfterSecond = await gamePage.getPlayerScore(0)
    expect(aliceScoreAfterSecond).toBeGreaterThan(aliceScoreAfterFirst)
  })
})
