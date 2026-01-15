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

  test("clicking best game score label focuses the corresponding dot and shows tooltip", async ({
    page,
  }) => {
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

    // Find the best label in game scores section (there's also one in move scores)
    // The game scores section has "best:" labels
    const bestLabels = page.locator("text=best:")
    await expect(bestLabels.first()).toBeVisible()

    // Make sure no tooltip is visible initially
    const tooltip = page.locator(".bg-neutral-800.text-white")
    await expect(tooltip).not.toBeVisible()

    // Click the best label (the one in game scores is the second one)
    // Game scores is below move scores
    const gameScoresBestLabel = bestLabels.nth(1)
    await gameScoresBestLabel.click()

    // Tooltip should appear
    await expect(tooltip).toBeVisible()

    // One of the dots should have a ring around it (selected state)
    const selectedDot = page.locator(".rounded-full.cursor-pointer.ring-2")
    await expect(selectedDot).toBeVisible()

    // Click the best label again to hide tooltip
    await gameScoresBestLabel.click()

    // Tooltip should be hidden
    await expect(tooltip).not.toBeVisible()
  })

  test("average move score line extends from label to x-axis", async ({ page }) => {
    // Create 4 finished games (need >=3 for stats to show)
    await createFinishedGame(page, true)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)

    // Wait for past games section to confirm games exist
    await expect(page.getByText("Past games")).toBeVisible()

    // Go to statistics page
    await page.getByText("Statistics").click()

    // Wait for statistics to render with player data
    await expect(page.getByText("Alice")).toBeVisible()

    // The average line in the histogram should extend the full height (84px)
    // from the top of the label area to the x-axis
    // The line is a 1px wide div with teal-600 background
    const avgLine = page.locator(".bg-teal-600.w-px").first()
    await expect(avgLine).toBeVisible()

    // Verify the line has the correct height (84px = 28px label area + 56px chart)
    const height = await avgLine.evaluate(el => el.style.height)
    expect(height).toBe("84px")
  })

  test("average game score label has vertical spacing from chart in DotPlot", async ({ page }) => {
    // Create 4 finished games (need >=3 for stats to show)
    await createFinishedGame(page, true)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)

    // Wait for past games section to confirm games exist
    await expect(page.getByText("Past games")).toBeVisible()

    // Go to statistics page
    await page.getByText("Statistics").click()

    // Wait for statistics to render with player data
    await expect(page.getByText("Alice")).toBeVisible()

    // The avg label in the DotPlot (game scores section) should have amber background
    // Find the game scores section avg label (amber-600 background)
    const avgLabel = page.locator(".bg-amber-600").filter({ hasText: "avg:" }).first()
    await expect(avgLabel).toBeVisible()

    // The vertical reference line for average in DotPlot should extend full height
    // including the 28px label area height (h-full on the line)
    const avgLine = page.locator(".bg-amber-600.w-px.h-full").first()
    await expect(avgLine).toBeVisible()

    // Verify the chart container has the label area height included
    // The line has h-full class, meaning it extends to the full container height
    // Parent container should include the 28px label area height
    const parent = avgLine.locator("..")
    const parentHeight = await parent.evaluate(el => parseInt(getComputedStyle(el).height))
    // Chart height should be at least minHeight (48) + dotSpacing (7) + labelAreaHeight (28) = 83px
    expect(parentHeight).toBeGreaterThanOrEqual(83)
  })

  test("best game score line is centered on dot and doesn't reach top of chart", async ({ page }) => {
    // Create 4 finished games (need >=3 for stats to show)
    await createFinishedGame(page, true)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)

    // Wait for past games section to confirm games exist
    await expect(page.getByText("Past games")).toBeVisible()

    // Go to statistics page
    await page.getByText("Statistics").click()

    // Wait for statistics to render with player data
    await expect(page.getByText("Alice")).toBeVisible()

    // Find the best label in game scores section (amber-600 background, contains "best:")
    const bestLabels = page.locator(".bg-amber-600").filter({ hasText: "best:" })
    const gameScoresBestLabel = bestLabels.first()
    await expect(gameScoresBestLabel).toBeVisible()

    // The connecting line should be a 1px amber-600 line inside the x-axis label area
    // It connects the best label to the best dot
    // The line should NOT have h-full class (that would make it go to top)
    // Instead it should have a specific height set via style
    // Note: Use .first() since there are 2 players with stats, each with their own best line
    const bestLine = page.locator(".bg-amber-600.w-px.pointer-events-none").first()
    await expect(bestLine).toBeVisible()

    // The line should have a fixed height set via inline style, not h-full class
    const hasHFullClass = await bestLine.evaluate(el => el.classList.contains("h-full"))
    expect(hasHFullClass).toBe(false)

    // The line should have an explicit height style
    const lineHeight = await bestLine.evaluate(el => el.style.height)
    expect(lineHeight).toBeTruthy()
    expect(parseInt(lineHeight)).toBeGreaterThan(0)

    // The line's left position should match the dot's x position (centered)
    // Both should use percentage positioning
    const lineLeft = await bestLine.evaluate(el => el.style.left)
    expect(lineLeft).toContain("%")

    // Find the corresponding best dot (the one that would be selected when clicking the label)
    // Click the label to select the best dot
    await gameScoresBestLabel.click()
    const selectedDot = page.locator(".rounded-full.cursor-pointer.ring-2").first()
    await expect(selectedDot).toBeVisible()

    // The dot's left position (from style) should match the line's left position
    const dotLeftStyle = await selectedDot.evaluate(el => el.style.left)
    // The dot position is like "calc(X% - 3px)" where X matches the line's percentage
    expect(dotLeftStyle).toContain("%")
  })

  test("player cards have matching border and shadow colors", async ({ page }) => {
    // Create 4 finished games (need >=3 for stats to show)
    await createFinishedGame(page, true)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)
    await createFinishedGame(page, false)

    // Wait for past games section to confirm games exist
    await expect(page.getByText("Past games")).toBeVisible()

    // Go to statistics page
    await page.getByText("Statistics").click()

    // Wait for statistics to render with player data
    await expect(page.getByText("Alice")).toBeVisible()

    // Find the player card (white background with border)
    const playerCard = page.locator(".rounded-lg.border.bg-white").first()
    await expect(playerCard).toBeVisible()

    // Verify it has neutral-300 border
    await expect(playerCard).toHaveClass(/border-neutral-300/)

    // Check that the shadow uses a CSS variable color (oklch)
    const boxShadow = await playerCard.evaluate(el =>
      window.getComputedStyle(el).boxShadow
    )
    // The shadow should contain oklch color (neutral-300) rather than only black rgba values
    expect(boxShadow).toContain("oklch")
  })
})
