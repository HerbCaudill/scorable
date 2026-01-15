import { test, expect } from "@playwright/test"
import { HomePage } from "../pages/home.page"
import { PlayerSetupPage } from "../pages/player-setup.page"
import { GamePage } from "../pages/game.page"
import { clearStorage } from "../fixtures/storage-fixtures"
import { seedNearEndGame } from "../fixtures/seed-game"

test.describe("Home screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearStorage(page)
    // No reload needed - clearStorage is synchronous
  })

  test("shows New Game button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "New game" })).toBeVisible()
  })

  test("does not show active games when none exist", async ({ page }) => {
    // No active games section should be visible
    await expect(page.getByText("Active games")).not.toBeVisible()
  })

  test("shows Create test games button when no games exist", async ({ page }) => {
    // Button should be visible when there are no games
    await expect(page.getByRole("button", { name: "Create test games" })).toBeVisible()
  })

  test("hides Create test games button when games exist", async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    // Create a new game
    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, "Alice")
    await setupPage.addNewPlayer(1, "Bob")
    await setupPage.startGame()
    await gamePage.expectOnGameScreen()

    // Navigate back to home
    await page.evaluate(() => {
      window.location.hash = ""
    })
    await expect(page.getByRole("button", { name: "New game" })).toBeVisible()

    // Create test games button should not be visible
    await expect(page.getByRole("button", { name: "Create test games" })).not.toBeVisible()
  })

  test("navigates to player setup on New Game click", async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.clickNewGame()

    await expect(page.getByRole("button", { name: "Start game" })).toBeVisible()
  })

  test("shows active game after creating one", async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    // Create a new game
    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, "Alice")
    await setupPage.addNewPlayer(1, "Bob")
    await setupPage.startGame()
    await gamePage.expectOnGameScreen()

    // Navigate to home by clearing the hash (without full page reload)
    await page.evaluate(() => {
      window.location.hash = ""
    })
    // Wait for app to react to hash change and show home screen
    await expect(page.getByRole("button", { name: "New game" })).toBeVisible()

    // Should show active games section
    await expect(page.getByText("Active games")).toBeVisible()
    await expect(page.getByText("Alice")).toBeVisible()
    await expect(page.getByText("Bob")).toBeVisible()
  })

  test("shows past games after finishing one", async ({ page }) => {
    // Seed a near-end game and finish it properly
    await seedNearEndGame(page)
    const gamePage = new GamePage(page)
    await gamePage.finishGame()

    // Should be back on home screen with past games section
    await expect(page.getByText("Past games")).toBeVisible()
  })

  test("can click on active game to resume", async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    // Create a new game
    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, "Alice")
    await setupPage.addNewPlayer(1, "Bob")
    await setupPage.startGame()
    await gamePage.expectOnGameScreen()

    // Make a move
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Navigate to home by clearing the hash (without full page reload)
    await page.evaluate(() => {
      window.location.hash = ""
    })
    // Wait for app to react to hash change and show home screen
    await expect(page.getByRole("button", { name: "New game" })).toBeVisible()

    // Wait for home screen and active games to load
    await expect(page.getByText("Active games")).toBeVisible()

    // Click on the Resume button in the game card
    await page.getByRole("button", { name: "Resume" }).click()

    // Should see the game screen with the board and previously placed tiles
    await gamePage.expectOnGameScreen()
    await gamePage.expectTileAt(7, 7, "C")
  })

  test("can navigate to past game", async ({ page }) => {
    // Seed a near-end game and finish it properly
    await seedNearEndGame(page)
    const gamePage = new GamePage(page)
    await gamePage.finishGame()

    const homePage = new HomePage(page)

    // Should be on home screen with past games
    await expect(page.getByText("Past games")).toBeVisible()

    // Click on past game
    await homePage.clickPastGame(0)

    // Should see the past game view with Back button
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible()
  })

  test("logo tile has matching border and shadow colors", async ({ page }) => {
    // The logo tile should have an amber border and amber shadow (not black)
    // Find the logo container (has the "S" letter and the score "1")
    const logoTile = page.locator(".bg-amber-100.-rotate-12").first()
    await expect(logoTile).toBeVisible()

    // Check that the logo has an amber border
    await expect(logoTile).toHaveClass(/border-amber-300/)

    // Check that the shadow uses amber color (via CSS variable)
    const boxShadow = await logoTile.evaluate(el => window.getComputedStyle(el).boxShadow)
    // The shadow should contain oklch color (amber) rather than only black rgba values
    // The browser includes empty rgba(0,0,0,0) placeholders, so we check for oklch
    expect(boxShadow).toContain("oklch")
  })
})
