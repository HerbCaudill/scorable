import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"

import { seedTwoPlayerGame } from "../fixtures/seed-game"

let gamePage: GamePage

test.beforeEach(async ({ page }) => {
  await seedTwoPlayerGame(page)

  gamePage = new GamePage(page)
})

test.describe("Move correction", () => {
  test("long-press on move enters edit mode", async () => {
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Long-press on Alice's first move
    await gamePage.longPressMove("Alice", 0)
    await gamePage.expectInEditMode()
  })

  test("cancel edit returns to normal mode", async () => {
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    await gamePage.longPressMove("Alice", 0)
    await gamePage.expectInEditMode()

    await gamePage.cancelEdit()
    await gamePage.expectNotInEditMode()
  })

  test("edited move updates score", async () => {
    // Play CAT (C=3, A=1, T=1 = 5 * 2 center = 10)
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    const initialScore = await gamePage.getPlayerScore(0)
    expect(initialScore).toBe(10)

    // Bob passes
    await gamePage.pass()

    // Edit Alice's move - add letter S to make CATS
    await gamePage.longPressMove("Alice", 0)
    await gamePage.expectInEditMode()

    // Click on cell after T to give focus and add S
    await gamePage.clickCell(7, 10) // Click after T
    await gamePage.typeLetters("S")
    await gamePage.saveEdit()

    // Score should now be 12 (CATS = C=3 + A=1 + T=1 + S=1 = 6 * 2 center = 12)
    const newScore = await gamePage.getPlayerScore(0)
    expect(newScore).toBe(12)

    // Verify the board shows CATS
    await gamePage.expectTileAt(7, 7, "C")
    await gamePage.expectTileAt(7, 8, "A")
    await gamePage.expectTileAt(7, 9, "T")
    await gamePage.expectTileAt(7, 10, "S")
  })

  test("edited move persists after reload", async ({ page }) => {
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob passes
    await gamePage.pass()

    // Edit to CATS (add S)
    await gamePage.longPressMove("Alice", 0)
    await gamePage.clickCell(7, 10) // Click after T
    await gamePage.typeLetters("S")
    await gamePage.saveEdit()

    // Verify score updated
    expect(await gamePage.getPlayerScore(0)).toBe(12)

    // Reload - the app auto-navigates via URL hash
    await page.reload()
    await page.waitForSelector('[role="grid"][aria-label="Scrabble board"]')

    // Should show CATS and score persisted
    await gamePage.expectTileAt(7, 7, "C")
    await gamePage.expectTileAt(7, 8, "A")
    await gamePage.expectTileAt(7, 9, "T")
    await gamePage.expectTileAt(7, 10, "S")
    expect(await gamePage.getPlayerScore(0)).toBe(12)
  })

  test("cannot enter edit mode with tiles in progress", async () => {
    // Alice plays CAT
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob starts placing tiles (but doesn't commit)
    await gamePage.placeWord(8, 7, "AT", "vertical")

    // Try to edit Alice's move - should show error toast
    await gamePage.longPressMove("Alice", 0)

    // Should NOT enter edit mode
    await gamePage.expectNotInEditMode()

    // Should show error toast
    await gamePage.expectErrorToast("Clear current move first")
  })

  test("cursor advances when typing during edit mode", async () => {
    // Alice plays CAT
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob passes
    await gamePage.pass()

    // Edit Alice's move
    await gamePage.longPressMove("Alice", 0)
    await gamePage.expectInEditMode()

    // Click on the first cell (C) to start re-typing
    await gamePage.clickCell(7, 7)
    await gamePage.expectCellSelected(7, 7)

    // Type D - should replace C and cursor should advance to next cell (A position)
    await gamePage.typeLetters("D")
    await gamePage.expectCellSelected(7, 8)

    // Type O - should replace A and cursor should advance
    await gamePage.typeLetters("O")
    await gamePage.expectCellSelected(7, 9)

    // Type G - should replace T and cursor should advance to next empty cell
    await gamePage.typeLetters("G")
    await gamePage.expectCellSelected(7, 10)

    // Save and verify the word is now DOG
    await gamePage.saveEdit()
    await gamePage.expectTileAt(7, 7, "D")
    await gamePage.expectTileAt(7, 8, "O")
    await gamePage.expectTileAt(7, 9, "G")
  })

  test("editing move shows only that moves tiles on board", async () => {
    // Alice plays CAT
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob plays CATS (adds S)
    await gamePage.clickCell(7, 10)
    await gamePage.typeLetters("S")
    await gamePage.endTurn()

    // Edit Alice's first move - board should show CAT without Bob's S
    await gamePage.longPressMove("Alice", 0)
    await gamePage.expectInEditMode()

    // The S from Bob's move should still be visible (excluded moves don't hide other moves)
    // But Alice's tiles (C, A, T) should be shown as "new" tiles (editable)
    await gamePage.expectNewTileAt(7, 7)
    await gamePage.expectNewTileAt(7, 8)
    await gamePage.expectNewTileAt(7, 9)

    await gamePage.cancelEdit()
  })
})
