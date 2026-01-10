import { test, expect } from "@playwright/test"
import { HomePage } from "../pages/home.page"
import { PastGamePage } from "../pages/past-game.page"
import { GamePage } from "../pages/game.page"
import { seedNearEndGame } from "../fixtures/seed-game"

/**
 * Helper to create and finish a game by seeding a near-end game and clicking End
 * @param clearStorage Whether to clear existing games first (default true)
 */
async function createFinishedGame(page: import("@playwright/test").Page, clearStorage = true) {
  // Seed a near-end game (7 tiles remaining, at threshold for 2 players)
  await seedNearEndGame(page, clearStorage)
  const gamePage = new GamePage(page)

  // Click End to go to EndGameScreen, then apply to finish
  await gamePage.finishGame()

  // Now on home screen with past games
  const homePage = new HomePage(page)
  await homePage.expectOnHomeScreen()
}

test.describe("Past games", () => {
  test("can view past game details", async ({ page }) => {
    await createFinishedGame(page)

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    const pastGamePage = new PastGamePage(page)
    await pastGamePage.expectOnPastGameScreen()

    // Should see player names
    await pastGamePage.expectPlayerName("Alice")
    await pastGamePage.expectPlayerName("Bob")
  })

  test("past game board shows tiles", async ({ page }) => {
    await createFinishedGame(page)

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    // The near-end game has RIM at center (from seed-game.ts NEAR_END_GAME_MOVES)
    const gamePage = new GamePage(page)
    await gamePage.expectTileAt(7, 6, "R")
    await gamePage.expectTileAt(7, 7, "I")
    await gamePage.expectTileAt(7, 8, "M")
  })

  test("past game board is read-only", async ({ page }) => {
    await createFinishedGame(page)

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    // Try clicking a cell - should not show cursor
    const cell = page.getByRole("gridcell", { name: "A1", exact: true })
    await cell.click()

    // No cursor should appear (aria-selected should not be true)
    await expect(cell).not.toHaveAttribute("aria-selected", "true")

    // Try typing - should not place tile
    await page.keyboard.type("X")
    await expect(cell).not.toContainText("X")
  })

  test("back button returns to home", async ({ page }) => {
    await createFinishedGame(page)

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    const pastGamePage = new PastGamePage(page)
    await pastGamePage.goBack()

    await homePage.expectOnHomeScreen()
  })

  test("shows scores for each player", async ({ page }) => {
    await createFinishedGame(page)

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    const pastGamePage = new PastGamePage(page)

    // Both players should have positive scores from the near-end game
    const aliceScore = await pastGamePage.getPlayerScore(0)
    const bobScore = await pastGamePage.getPlayerScore(1)

    expect(aliceScore).toBeGreaterThan(0)
    expect(bobScore).toBeGreaterThan(0)
  })

  test("past games show winner indicator on home screen", async ({ page }) => {
    await createFinishedGame(page)

    // The trophy icon should be visible next to the winner(s)
    // Note: Both players may have tied, so there could be multiple trophies
    await expect(page.locator(".text-amber-500").first()).toBeVisible()
  })

  test("multiple past games are listed", async ({ page }) => {
    // Create first finished game (clear storage)
    await createFinishedGame(page, true)

    // Create second finished game (don't clear storage)
    await createFinishedGame(page, false)

    const homePage = new HomePage(page)
    const count = await homePage.getPastGamesCount()
    expect(count).toBe(2)
  })

  test("can navigate between different past games", async ({ page }) => {
    // Create two finished games (both Alice/Bob since we use seedNearEndGame)
    await createFinishedGame(page, true)
    await createFinishedGame(page, false)

    const homePage = new HomePage(page)
    const pastGamePage = new PastGamePage(page)

    // View first game (most recent)
    await homePage.clickPastGame(0)
    await pastGamePage.expectPlayerName("Alice")
    await pastGamePage.goBack()

    // View second game (older one)
    await homePage.clickPastGame(1)
    await pastGamePage.expectPlayerName("Alice")
  })
})
