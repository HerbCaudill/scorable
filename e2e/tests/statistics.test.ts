import { test, expect } from "@playwright/test"
import { seedNearEndGame } from "../fixtures/seed-game"
import { GamePage } from "../pages/game.page"
import { HomePage } from "../pages/home.page"

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

test.describe("Statistics", () => {
  test("statistics button is visible when past games exist", async ({ page }) => {
    await createFinishedGame(page)

    // Statistics button should be visible in the Past games header
    await expect(page.getByText("Past games")).toBeVisible()
    await expect(page.getByText("Statistics")).toBeVisible()
  })

  test("statistics page shows empty message when players have <3 games", async ({ page }) => {
    // Create 1 finished game (below threshold of 3)
    await createFinishedGame(page)

    // Click Statistics
    await page.getByText("Statistics").click()

    // Should show message about needing more games
    await expect(page.getByText("No player statistics yet")).toBeVisible()
    await expect(page.getByText("Complete at least 3 games")).toBeVisible()
  })

  test("back button returns to home screen", async ({ page }) => {
    await createFinishedGame(page)

    // Click Statistics
    await page.getByText("Statistics").click()

    // Click back button
    await page.getByRole("button", { name: "Back" }).click()

    // Should be back on home screen
    await expect(page.getByRole("button", { name: "New game" })).toBeVisible()
  })

  test("statistics page shows games completed count", async ({ page }) => {
    await createFinishedGame(page)

    // Click Statistics
    await page.getByText("Statistics").click()

    // Should show games count
    await expect(page.getByText("1 game completed")).toBeVisible()
  })
})
