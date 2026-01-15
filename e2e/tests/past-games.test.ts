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

  test("delete confirm dialog appears above footer buttons", async ({ page }) => {
    await createFinishedGame(page)

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    // Click the Delete button to show the confirm dialog
    await page.getByRole("button", { name: /Delete/i }).click()

    // The dialog backdrop should be visible
    const backdrop = page.locator('[data-slot="alert-dialog-overlay"]')
    await expect(backdrop).toBeVisible()

    // Get z-index of backdrop and delete button
    const backdropZIndex = await backdrop.evaluate((el: Element) => {
      return Number(window.getComputedStyle(el).zIndex)
    })

    const deleteButton = page.getByRole("button", { name: /Delete/i }).first()
    const buttonContainer = page.locator(".relative.z-60")
    const buttonZIndex = await buttonContainer.evaluate((el: Element) => {
      return Number(window.getComputedStyle(el).zIndex)
    })

    // Dialog backdrop (z-80) should be higher than button container (z-60)
    expect(backdropZIndex).toBeGreaterThan(buttonZIndex)

    // Cancel the dialog
    await page.getByRole("button", { name: /Cancel/i }).click()
    await expect(backdrop).not.toBeVisible()
  })

  test("past games list is scrollable when many games exist", async ({ page }) => {
    // Navigate to home and create test games
    await page.goto("/")
    await page.getByRole("button", { name: /Create test games/i }).click()

    // Wait for past games to appear (at least 10 finished games from createTestGames)
    const pastGamesContainer = page.locator(".overflow-y-auto")
    await expect(pastGamesContainer).toBeVisible()

    // Wait for games to load
    await page.waitForTimeout(500)

    // Get all past game items
    const pastGameItems = pastGamesContainer.locator(".cursor-pointer")
    const count = await pastGameItems.count()
    expect(count).toBeGreaterThanOrEqual(10)

    // Check that content overflows and scrolling is possible
    const scrollState = await pastGamesContainer.evaluate((el: Element) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      canScroll: el.scrollHeight > el.clientHeight,
    }))

    // Content MUST overflow to allow scrolling
    expect(scrollState.canScroll).toBe(true)

    // Get the last game item
    const lastItem = pastGameItems.last()

    // Scroll to the bottom of the container
    await pastGamesContainer.evaluate((el: Element) => {
      el.scrollTop = el.scrollHeight
    })

    // Wait for scroll to complete
    await page.waitForTimeout(100)

    // Verify we actually scrolled (scrollTop should be > 0)
    const finalScrollState = await pastGamesContainer.evaluate((el: Element) => ({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))

    expect(finalScrollState.scrollTop).toBeGreaterThan(0)

    // Verify the last item is now visible
    await expect(lastItem).toBeVisible()
  })
})
