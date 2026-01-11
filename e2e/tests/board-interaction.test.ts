import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"
import { seedTwoPlayerGame } from "../fixtures/seed-game"

test.describe("Board interaction", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await seedTwoPlayerGame(page)
    gamePage = new GamePage(page)
  })

  test("clicking cell places cursor", async () => {
    await gamePage.clickCell(7, 7)

    // The cursor should be visible (indicated by aria-selected)
    await gamePage.expectCellSelected(7, 7)
  })

  test("typing letter places tile", async () => {
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("A")

    await gamePage.expectTileAt(7, 7, "A")
  })

  test("cursor advances after placing tile", async () => {
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("AB")

    // A should be at 7,7
    await gamePage.expectTileAt(7, 7, "A")
    // B should be at 7,8 (cursor advanced horizontally)
    await gamePage.expectTileAt(7, 8, "B")
  })

  test("clicking same cell toggles direction", async () => {
    await gamePage.clickCell(7, 7)
    await gamePage.clickCell(7, 7) // Toggle to vertical
    await gamePage.typeLetters("AB")

    // A should be at 7,7
    await gamePage.expectTileAt(7, 7, "A")
    // B should be at 8,7 (cursor advanced vertically)
    await gamePage.expectTileAt(8, 7, "B")
  })

  test("arrow keys move cursor", async () => {
    await gamePage.clickCell(7, 7)

    // Move right
    await gamePage.pressKey("ArrowRight")
    await gamePage.expectCellSelected(7, 8)

    // Move down
    await gamePage.pressKey("ArrowDown")
    await gamePage.expectCellSelected(8, 8)

    // Move left
    await gamePage.pressKey("ArrowLeft")
    await gamePage.expectCellSelected(8, 7)

    // Move up
    await gamePage.pressKey("ArrowUp")
    await gamePage.expectCellSelected(7, 7)
  })

  test("backspace removes last placed tile", async ({ page }) => {
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("AB")

    // Both tiles should be visible
    await gamePage.expectTileAt(7, 7, "A")
    await gamePage.expectTileAt(7, 8, "B")

    // Delete B
    await gamePage.pressKey("Backspace")

    // A should still be there, B should be gone
    await gamePage.expectTileAt(7, 7, "A")
    const cellB = page.getByRole("gridcell", { name: "I8", exact: true })
    await expect(cellB).not.toContainText("B")
  })

  test("space places blank tile", async () => {
    await gamePage.clickCell(7, 7)
    await gamePage.pressKey(" ")

    // Select a letter for the blank tile in the dialog
    await gamePage.selectBlankLetter("A")

    // Blank tile should be visible (indicated by data-tile-state="new")
    await gamePage.expectNewTileAt(7, 7)
  })

  test("can place word across multiple cells", async () => {
    await gamePage.placeWord(7, 7, "SCRABBLE")

    await gamePage.expectTileAt(7, 7, "S")
    await gamePage.expectTileAt(7, 8, "C")
    await gamePage.expectTileAt(7, 9, "R")
    await gamePage.expectTileAt(7, 10, "A")
    await gamePage.expectTileAt(7, 11, "B")
    await gamePage.expectTileAt(7, 12, "B")
    await gamePage.expectTileAt(7, 13, "L")
    await gamePage.expectTileAt(7, 14, "E")
  })

  test("can place vertical word", async () => {
    await gamePage.placeWord(7, 7, "CAT", "vertical")

    await gamePage.expectTileAt(7, 7, "C")
    await gamePage.expectTileAt(8, 7, "A")
    await gamePage.expectTileAt(9, 7, "T")
  })

  test("cursor skips existing tiles when typing", async () => {
    // Place first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Second player places connecting word - start at empty cell below A
    await gamePage.clickCell(8, 8) // Start below A
    await gamePage.typeLetters("S") // This creates "AS" vertically

    // S should be placed at row 8, col 8
    await gamePage.expectTileAt(8, 8, "S")
  })

  test("backspace skips over existing tiles", async ({ page }) => {
    // Player 1 places first word: CAT at center
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Player 2 places word that spans existing tiles: ERASE starting at 7,6
    // E at 7,6, then R at 7,7 (where C already is), so R goes to 7,10, then A, S, E
    // Actually let's place a simpler test: add tiles before and after existing word
    // Place B at 7,6 (before CAT), then D at 7,10 (after CAT)
    await gamePage.clickCell(7, 6)
    await gamePage.typeLetters("B") // B at 7,6
    // Cursor should skip C, A, T and land at 7,10
    await gamePage.typeLetters("D") // D at 7,10

    await gamePage.expectTileAt(7, 6, "B")
    await gamePage.expectTileAt(7, 10, "D")

    // Now backspace from current position (7,11)
    // Should skip back over existing tiles (CAT) and delete D first, then B
    await gamePage.pressKey("Backspace") // Deletes D at 7,10

    const cellD = page.getByRole("gridcell", { name: "K8", exact: true })
    await expect(cellD).not.toContainText("D")

    // Now backspace again - should skip over existing tiles (CAT) and delete B
    await gamePage.pressKey("Backspace") // Deletes B at 7,6

    const cellB = page.getByRole("gridcell", { name: "G8", exact: true })
    await expect(cellB).not.toContainText("B")
  })
})
