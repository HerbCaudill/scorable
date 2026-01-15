import { test, expect } from "@playwright/test"
import { HomePage } from "../pages/home.page"
import { GamePage } from "../pages/game.page"
import { seedNearEndGame } from "../fixtures/seed-game"

test.describe("End game", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await seedNearEndGame(page)
    gamePage = new GamePage(page)

    // Verify tiles remaining is low (should be 7 for 2 players to show EndGameScreen)
    const tilesButton = page.getByRole("button", { name: /Tiles/ })
    const tilesText = await tilesButton.textContent()
    const tilesMatch = tilesText?.match(/Tiles \((\d+)\)/)
    const tilesRemaining = tilesMatch ? parseInt(tilesMatch[1], 10) : -1
    if (tilesRemaining > 7) {
      throw new Error(
        `Expected <= 7 tiles remaining, but got ${tilesRemaining}. Tile text: "${tilesText}"`,
      )
    }
  })

  test("shows EndGameScreen when tiles <= threshold", async () => {
    // Click End Game - should show EndGameScreen, not simple dialog
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()
  })

  test("defaults to last player as who ended the game", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Last move was by Alice (playerIndex 0), so Alice should be shown as "ended the game"
    await gamePage.expectPlayerEndedGame("Alice")
  })

  test("can change who ended the game", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Change to Bob
    await gamePage.selectPlayerWhoEndedGame("Bob")
    await gamePage.expectPlayerEndedGame("Bob")
  })

  test("can select nobody for blocked game", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    await gamePage.selectNobodyEndedGame()

    // Neither player should show "ended the game"
    const aliceSection = page.locator(".rounded-lg.border.p-3").filter({ hasText: "Alice" })
    const bobSection = page.locator(".rounded-lg.border.p-3").filter({ hasText: "Bob" })
    await expect(aliceSection).not.toContainText("ended the game")
    await expect(bobSection).not.toContainText("ended the game")
  })

  test("auto-populates rack with remaining tiles for 2-player game", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack should be auto-populated with remaining tiles
    // The remaining tiles are I, N, N, R, T, U (values: 1+1+1+1+1+1 = 6)
    const adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-6")
  })

  test("player who ended game gets bonus", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack is auto-populated with remaining tiles
    // Alice (who ended) should get bonus equal to Bob's remaining tile values
    // The remaining tiles are I, N, N, R, T, U (values: 1+1+1+1+1+1 = 6)
    const aliceAdjustment = await gamePage.getPlayerAdjustment("Alice")
    expect(aliceAdjustment).toBe("+6")
  })

  test("validates rack tiles against remaining", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack is auto-populated with remaining tiles
    // Now try to enter a Q tile (which was already played in the game)
    await gamePage.enterRackTiles("Bob", "Q")

    // Should show error since Q was already used (it's now in rack via typing)
    // New format: tile component followed by "none left" or "X entered, but only Y left"
    await gamePage.expectRackError("Bob", "none left")

    // Apply button should be disabled
    expect(await gamePage.isApplyButtonDisabled()).toBe(true)
  })

  test("can cancel and return to game", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    await gamePage.cancelEndGame()
    await page.waitForSelector('[role="grid"][aria-label="Scrabble board"]')
  })

  test("apply creates adjustment moves and ends game", async ({ page }) => {
    const homePage = new HomePage(page)

    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack is auto-populated with remaining tiles
    // Just click apply - the rack is already populated correctly
    await gamePage.applyAndEndGame()

    // Should return to home screen
    await homePage.expectOnHomeScreen()
  })

  test("backspace removes tiles from rack input", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack is auto-populated with remaining tiles
    // The remaining tiles are I, N, N, R, T, U (values: 1+1+1+1+1+1 = 6)
    let adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-6")

    // Remove one tile
    await gamePage.clearRackTiles("Bob", 1)
    adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-5") // One less tile (value 1)
  })

  test("can override auto-populated rack tiles", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack starts auto-populated with 6 tiles
    let adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-6")

    // Clear all tiles - when rack is empty, deduction shows nothing (not "0")
    await gamePage.clearRackTiles("Bob", 6)

    // Enter just 3 tiles - now the adjustment should show
    await gamePage.enterRackTiles("Bob", "INN")
    adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-3") // I=1, N=1, N=1
  })

  test("rack error shows tile component with appropriate message", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Bob's rack is auto-populated with remaining tiles: I, N, N, R, T, U
    // Enter a Q tile (which has 0 remaining since it was used in the game)
    await gamePage.enterRackTiles("Bob", "Q")

    // Error should show "none left" for tile with 0 remaining
    const bobSection = page.locator(".rounded-lg.border.p-3").filter({ hasText: "Bob" })
    // Select the error div specifically (has flex layout for tile + text)
    const errorElement = bobSection.locator("div.flex.items-center.gap-1\\.5.text-red-600")
    await expect(errorElement).toContainText("none left")

    // Error should contain a tile component (div with Tile styling)
    const tileInError = errorElement.locator("div.bg-amber-100")
    await expect(tileInError).toBeVisible()

    // Clear Q and test the "X entered, but only Y left" format
    await gamePage.clearRackTiles("Bob", 1) // Remove Q

    // Now add 3 more N tiles (already have 2, only 2 available total)
    await gamePage.enterRackTiles("Bob", "NNN")

    // Should show "X entered, but only Y left" format
    await expect(errorElement).toContainText("entered, but only")
    await expect(errorElement).toContainText("left")
  })
})
