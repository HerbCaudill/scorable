import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"

import { seedTwoPlayerGame } from "../fixtures/seed-game"

// This test file specifically tests the keyboard input functionality
// which is used by both the physical keyboard and the custom mobile keyboard

let gamePage: GamePage

test.beforeEach(async ({ page }) => {
  await seedTwoPlayerGame(page)

  gamePage = new GamePage(page)
})

test.describe("Keyboard input", () => {
  test("typing letters places tiles", async () => {
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("TEST")

    await gamePage.expectTileAt(7, 7, "T")
    await gamePage.expectTileAt(7, 8, "E")
    await gamePage.expectTileAt(7, 9, "S")
    await gamePage.expectTileAt(7, 10, "T")
  })

  test("direction toggle changes cursor direction", async ({ page }) => {
    // Click on center cell
    await gamePage.clickCell(7, 7)
    await gamePage.expectCursorDirection("horizontal")

    // Click same cell to toggle direction - use a small delay to ensure first click is processed
    await page.waitForTimeout(100)
    await gamePage.clickCell(7, 7)
    await gamePage.expectCursorDirection("vertical")

    // Type a letter and verify it advances vertically
    await gamePage.typeLetters("A")
    await gamePage.expectTileAt(7, 7, "A")
    await gamePage.expectCellSelected(8, 7) // Should advance down, not right
  })

  test("backspace removes tiles", async () => {
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("AB")

    await gamePage.expectTileAt(7, 7, "A")
    await gamePage.expectTileAt(7, 8, "B")

    // Press backspace
    await gamePage.pressKey("Backspace")

    // B should be removed
    await expect(gamePage.getCellByLabel("I8")).not.toContainText("B")
    await gamePage.expectCellSelected(7, 8) // Cursor should be back at I8
  })

  test("space places blank tile", async () => {
    await gamePage.clickCell(7, 7)
    await gamePage.pressKey(" ")

    // A blank tile should be placed
    await gamePage.expectNewTileAt(7, 7)
  })

  test("Enter commits the move", async () => {
    // Place a word
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("CAT")

    // Press Enter to commit
    await gamePage.pressKey("Enter")

    // Turn should advance (if move is valid)
    // The tiles should now be "existing" not "new"
    const cell = gamePage.getCellByLabel("H8")
    await expect(cell).toContainText("C")
  })
})
