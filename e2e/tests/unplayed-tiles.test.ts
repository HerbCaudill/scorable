import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"

import { seedTwoPlayerGame } from "../fixtures/seed-game"

test.describe("Unplayed tiles", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await seedTwoPlayerGame(page)
    gamePage = new GamePage(page)
  })

  test("opens unplayed tiles screen from game", async ({ page }) => {
    await gamePage.openTileBag()

    await expect(page.getByRole("heading", { name: "Unplayed Tiles" })).toBeVisible()
  })

  test("shows remaining and played tile counts", async ({ page }) => {
    await gamePage.openTileBag()

    // At start of game, all 100 tiles are remaining, 0 played
    await expect(page.getByText("100 tiles remaining")).toBeVisible()
    await expect(page.getByText("0 played")).toBeVisible()
  })

  test("updates counts after tiles are played", async ({ page }) => {
    // Play a 4-letter word: CATS at center
    await gamePage.placeWord(7, 7, "CATS")
    await gamePage.endTurn()

    await gamePage.openTileBag()

    // 4 tiles played, 96 remaining
    await expect(page.getByText("96 tiles remaining")).toBeVisible()
    await expect(page.getByText("4 played")).toBeVisible()
  })

  test("back button returns to game screen", async ({ page }) => {
    await gamePage.openTileBag()
    await expect(page.getByRole("heading", { name: "Unplayed Tiles" })).toBeVisible()

    // Click back button
    await page.getByRole("button", { name: "Back" }).click()

    // Should be back on game screen
    await page.waitForSelector('[role="grid"][aria-label="Scrabble board"]')
  })

  test("displays all tile letters", async ({ page }) => {
    await gamePage.openTileBag()

    // Check that common letters are visible (at least the first tile of each)
    // The screen shows rows of tiles for each letter
    await expect(page.getByText("A", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("E", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("S", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("Z", { exact: true }).first()).toBeVisible()
  })
})
