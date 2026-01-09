import { test, expect } from "@playwright/test"
import { HomePage } from "../pages/home.page"
import { PlayerSetupPage } from "../pages/player-setup.page"
import { PastGamePage } from "../pages/past-game.page"
import { GamePage } from "../pages/game.page"
import { clearStorage } from "../fixtures/storage-fixtures"

/** Helper to create and finish a game through the UI */
async function createFinishedGameViaUI(
  page: import("@playwright/test").Page,
  playerNames: [string, string],
) {
  const homePage = new HomePage(page)
  const setupPage = new PlayerSetupPage(page)
  const gamePage = new GamePage(page)

  await homePage.clickNewGame()
  await setupPage.addNewPlayer(0, playerNames[0])
  await setupPage.addNewPlayer(1, playerNames[1])
  await setupPage.startGame()

  // Player 1 places CAT
  await gamePage.placeWord(7, 7, "CAT")
  await gamePage.endTurn()

  // Player 2 places DOG
  await gamePage.placeWord(8, 7, "DOG")
  await gamePage.endTurn()

  // End game (early termination)
  await gamePage.clickEndGame()
  await gamePage.confirmEndGame()
}

test.describe("Past games", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearStorage(page)
    await page.reload()
  })

  test("can view past game details", async ({ page }) => {
    await createFinishedGameViaUI(page, ["Alice", "Bob"])

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    const pastGamePage = new PastGamePage(page)
    await pastGamePage.expectOnPastGameScreen()

    // Should see player names
    await pastGamePage.expectPlayerName("Alice")
    await pastGamePage.expectPlayerName("Bob")
  })

  test("past game board shows tiles", async ({ page }) => {
    await createFinishedGameViaUI(page, ["Alice", "Bob"])

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    // The finished game has CAT at center
    const gamePage = new GamePage(page)
    await gamePage.expectTileAt(7, 7, "C")
    await gamePage.expectTileAt(7, 8, "A")
    await gamePage.expectTileAt(7, 9, "T")
  })

  test("past game board is read-only", async ({ page }) => {
    await createFinishedGameViaUI(page, ["Alice", "Bob"])

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
    await createFinishedGameViaUI(page, ["Alice", "Bob"])

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    const pastGamePage = new PastGamePage(page)
    await pastGamePage.goBack()

    await homePage.expectOnHomeScreen()
  })

  test("shows scores for each player", async ({ page }) => {
    await createFinishedGameViaUI(page, ["Alice", "Bob"])

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    const pastGamePage = new PastGamePage(page)

    // Scores should be visible (both should have scored)
    const aliceScore = await pastGamePage.getPlayerScore(0)
    const bobScore = await pastGamePage.getPlayerScore(1)

    expect(aliceScore).toBeGreaterThan(0)
    expect(bobScore).toBeGreaterThan(0)
  })

  test("past games show winner indicator on home screen", async ({ page }) => {
    await createFinishedGameViaUI(page, ["Alice", "Bob"])

    // The trophy icon should be visible next to the winner(s)
    // Note: Both players may have tied, so there could be multiple trophies
    await expect(page.locator(".text-amber-500").first()).toBeVisible()
  })

  test("multiple past games are listed", async ({ page }) => {
    // Create first finished game
    await createFinishedGameViaUI(page, ["Alice", "Bob"])

    // Create second finished game
    await createFinishedGameViaUI(page, ["Charlie", "Diana"])

    const homePage = new HomePage(page)
    const count = await homePage.getPastGamesCount()
    expect(count).toBe(2)
  })

  test("can navigate between different past games", async ({ page }) => {
    // Create first finished game
    await createFinishedGameViaUI(page, ["Alice", "Bob"])

    // Create second finished game
    await createFinishedGameViaUI(page, ["Charlie", "Diana"])

    const homePage = new HomePage(page)
    const pastGamePage = new PastGamePage(page)

    // View first game (most recent, so index 0 is Charlie/Diana)
    await homePage.clickPastGame(0)
    await pastGamePage.expectPlayerName("Charlie")
    await pastGamePage.goBack()

    // View second game (older one, index 1 is Alice/Bob)
    await homePage.clickPastGame(1)
    await pastGamePage.expectPlayerName("Alice")
  })
})
