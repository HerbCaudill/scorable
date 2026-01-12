import { test, expect } from "@playwright/test"
import { HomePage } from "../pages/home.page"
import { PlayerSetupPage } from "../pages/player-setup.page"
import { GamePage } from "../pages/game.page"
import { clearStorage, waitForAutomergePersistence } from "../fixtures/storage-fixtures"
import { seedNearEndGame } from "../fixtures/seed-game"

test.describe("Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearStorage(page)
    await page.reload()
  })

  test("game state persists across page reload", async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    // Start a game
    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, "Alice")
    await setupPage.addNewPlayer(1, "Bob")
    await setupPage.startGame()

    // Place a word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Verify score
    expect(await gamePage.getPlayerScore(0)).toBe(10)

    // Wait for IndexedDB to persist before reloading
    await waitForAutomergePersistence(page)

    // Reload page - game should auto-resume via URL hash
    await page.reload()

    // Wait for game screen to be visible (Automerge reloads from IndexedDB)
    await gamePage.expectOnGameScreen()

    // Wait for Automerge data to load from IndexedDB by waiting for score to appear
    // The score being 10 means the game data has loaded (CAT at center = 10 points)
    await expect(async () => {
      const score = await gamePage.getPlayerScore(0)
      expect(score).toBe(10)
    }).toPass({ timeout: 10000 })

    // CAT should still be on board
    await gamePage.expectTileAt(7, 7, "C")
    await gamePage.expectTileAt(7, 8, "A")
    await gamePage.expectTileAt(7, 9, "T")

    // Score should be preserved (already verified above)
    expect(await gamePage.getPlayerScore(0)).toBe(10)

    // Should be Bob's turn
    expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
  })

  test("player records persist for autocomplete", async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    // Create a game with specific players and quit (players are recorded on game start)
    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, "TestPlayer1")
    await setupPage.addNewPlayer(1, "TestPlayer2")
    await setupPage.startGame()

    // Go back to home (game stays active)
    await gamePage.clickBack()

    // Start new game
    await homePage.clickNewGame()

    // Open first player dropdown - previous players should be available
    await setupPage.clickPlayerSlot(0)
    await expect(page.getByRole("menuitem", { name: "TestPlayer1" })).toBeVisible()
    await expect(page.getByRole("menuitem", { name: "TestPlayer2" })).toBeVisible()
  })

  test("finished games appear in past games list", async ({ page }) => {
    // Seed a near-end game and finish it properly
    await seedNearEndGame(page)
    const gamePage = new GamePage(page)
    await gamePage.finishGame()

    const homePage = new HomePage(page)

    // Past games section should be visible
    await expect(page.getByText("Past games")).toBeVisible()

    // Verify past game count via UI
    const count = await homePage.getPastGamesCount()
    expect(count).toBe(1)
  })

  test("multiple games accumulate in history", async ({ page }) => {
    const gamePage = new GamePage(page)
    const homePage = new HomePage(page)

    // Play first game (seed near-end and finish, clear storage)
    await seedNearEndGame(page, true)
    await gamePage.finishGame()

    // Play second game (seed near-end and finish, don't clear storage)
    await seedNearEndGame(page, false)
    await gamePage.finishGame()

    // Should have 2 past games
    const count = await homePage.getPastGamesCount()
    expect(count).toBe(2)
  })

  test("active game shown on home screen after navigating away", async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    // Start first game (don't finish)
    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, "Alice")
    await setupPage.addNewPlayer(1, "Bob")
    await setupPage.startGame()
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Navigate to home by clearing hash
    await page.evaluate(() => {
      window.location.hash = ""
    })
    await expect(page.getByRole("button", { name: "New game" })).toBeVisible()

    // Active games section should show the game
    await expect(page.getByText("Active games")).toBeVisible()
    await expect(page.getByText("Alice")).toBeVisible()
    await expect(page.getByText("Bob")).toBeVisible()
  })

  test("timer state persists across reload", async ({ page }) => {
    const homePage = new HomePage(page)
    const setupPage = new PlayerSetupPage(page)
    const gamePage = new GamePage(page)

    // Start game and start timer
    await homePage.clickNewGame()
    await setupPage.addNewPlayer(0, "Alice")
    await setupPage.addNewPlayer(1, "Bob")
    await setupPage.startGame()

    await gamePage.toggleTimer() // Start timer

    // Wait for timer to decrement at least once
    const timer = gamePage.getPlayerTimer(0)
    await expect(timer).not.toHaveAttribute("aria-label", "30:00 remaining")

    // Get time before reload
    const timerBefore = gamePage.getPlayerTimer(0)
    const timeBefore = await timerBefore.getAttribute("aria-label")

    // Wait for IndexedDB to persist the timer event before reloading
    await waitForAutomergePersistence(page)

    // Reload - game auto-resumes via URL hash
    await page.reload()
    await gamePage.expectOnGameScreen()

    // The time remaining should have been persisted (though timer running state may reset)
    const timerAfter = gamePage.getPlayerTimer(0)
    const timeAfter = await timerAfter.getAttribute("aria-label")

    // Time should be less than or equal to initial 30:00
    expect(timeAfter).not.toBe("30:00 remaining")
  })
})
