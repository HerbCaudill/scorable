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

  test("clicking dot in game scores shows tooltip, clicking again hides it", async ({ page }) => {
    // Create 4 finished games using the UI helper (need >=3 for stats to show)
    await createFinishedGame(page, true)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)

    // Wait for past games section to confirm games exist
    await expect(page.getByText("Past games")).toBeVisible()

    // Click Statistics
    await page.getByText("Statistics").click()

    // Wait for statistics to render with player data
    await expect(page.getByText("Alice")).toBeVisible()

    // Get a dot in the game scores dot plot (move scores uses histogram now)
    // Dots are small circle elements with cursor-pointer
    const dots = page.locator(".rounded-full.cursor-pointer")
    const firstDot = dots.first()
    await expect(firstDot).toBeVisible()

    // Click the dot to show tooltip
    await firstDot.click()

    // Tooltip should appear (it's a dark background div with text)
    const tooltip = page.locator(".bg-neutral-800.text-white")
    await expect(tooltip).toBeVisible()

    // Click the same dot again to hide tooltip
    await firstDot.click()

    // Tooltip should be hidden
    await expect(tooltip).not.toBeVisible()
  })

  test("clicking outside game scores dot plot hides tooltip", async ({ page }) => {
    // Create 4 finished games using the UI helper (need >=3 for stats to show)
    await createFinishedGame(page, true)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)

    // Wait for past games section to confirm games exist
    await expect(page.getByText("Past games")).toBeVisible()

    // Click Statistics
    await page.getByText("Statistics").click()

    // Wait for statistics to render
    await expect(page.getByText("Alice")).toBeVisible()

    // Click a dot in game scores to show tooltip (move scores uses histogram now)
    const dots = page.locator(".rounded-full.cursor-pointer")
    const firstDot = dots.first()
    await firstDot.click()

    // Tooltip should appear
    const tooltip = page.locator(".bg-neutral-800.text-white")
    await expect(tooltip).toBeVisible()

    // Click outside the dot plot (on the header)
    await page.getByText("Statistics").click()

    // Tooltip should be hidden
    await expect(tooltip).not.toBeVisible()
  })

  test("clicking game score tooltip navigates to past game", async ({ page }) => {
    // Create 4 finished games using the UI helper (need >=3 for stats to show)
    await createFinishedGame(page, true)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)

    // Wait for past games section to confirm games exist
    await expect(page.getByText("Past games")).toBeVisible()

    // Click Statistics
    await page.getByText("Statistics").click()

    // Wait for statistics to render with player data
    await expect(page.getByText("Alice")).toBeVisible()

    // Click a dot in the game scores dot plot
    const dots = page.locator(".rounded-full.cursor-pointer")
    const firstDot = dots.first()
    await firstDot.click()

    // Tooltip should appear with arrow indicating it's clickable
    const tooltip = page.locator(".bg-neutral-800.text-white")
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText("→")

    // Click the tooltip to navigate to the game
    await tooltip.click()

    // Should navigate to past game view (URL contains /view/)
    await expect(page).toHaveURL(/.*#\/view\/.*/)

    // Should show the game board and player scores
    await expect(page.getByRole("grid", { name: "Scrabble board" })).toBeVisible()
    await expect(page.getByText("Alice")).toBeVisible()
    await expect(page.getByText("Bob")).toBeVisible()
  })
})
