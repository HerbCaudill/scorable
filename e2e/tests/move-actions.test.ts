import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"
import { seedTwoPlayerGame, seedGameWithMoves } from "../fixtures/seed-game"

test.describe("Move actions", () => {
  test.describe("Global undo/redo", () => {
    test("undo reverses the last move and restores board state", async ({ page }) => {
      // Seed an empty game and play move via UI to populate undo stack
      await seedTwoPlayerGame(page, "Alice", "Bob")

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Play CAT via UI
      await gamePage.placeWord(7, 7, "CAT")
      await gamePage.endTurn()

      // Verify state - CAT is on the board and it's Bob's turn
      await gamePage.expectTileAt(7, 7, "C")
      await gamePage.expectTileAt(7, 8, "A")
      await gamePage.expectTileAt(7, 9, "T")
      expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

      // Undo the move using global undo button
      await gamePage.clickUndo()

      // Board should be empty
      expect(await gamePage.cellHasTile(7, 7)).toBe(false)
      expect(await gamePage.cellHasTile(7, 8)).toBe(false)
      expect(await gamePage.cellHasTile(7, 9)).toBe(false)

      // It should be Alice's turn again
      expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
    })

    test("redo restores the undone move", async ({ page }) => {
      // Seed an empty game and play move via UI to populate undo stack
      await seedTwoPlayerGame(page, "Alice", "Bob")

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Play CAT via UI
      await gamePage.placeWord(7, 7, "CAT")
      await gamePage.endTurn()

      // Undo the move
      await gamePage.clickUndo()

      // Board should be empty and redo should be enabled
      expect(await gamePage.cellHasTile(7, 7)).toBe(false)
      expect(await gamePage.isRedoEnabled()).toBe(true)

      // Redo the move
      await gamePage.clickRedo()

      // After redo, redo should be disabled (nothing left to redo)
      expect(await gamePage.isRedoEnabled()).toBe(false)

      // Board should have CAT again
      await gamePage.expectTileAt(7, 7, "C")
      await gamePage.expectTileAt(7, 8, "A")
      await gamePage.expectTileAt(7, 9, "T")

      // It should be Bob's turn again
      expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
    })

    test("undo can undo a passed turn", async ({ page }) => {
      // Seed a game and play a move, then pass
      await seedTwoPlayerGame(page, "Alice", "Bob")

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Alice plays CAT
      await gamePage.placeWord(7, 7, "CAT")
      await gamePage.endTurn()

      // Bob passes
      await gamePage.pass()

      // Now it's Alice's turn
      expect(await gamePage.getCurrentPlayerIndex()).toBe(0)

      // Undo the pass
      await gamePage.clickUndo()

      // It should be Bob's turn again
      expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
    })

    test("undo can undo a successful challenge", async ({ page }) => {
      // Seed an empty game and play invalid word via UI
      await seedTwoPlayerGame(page, "Alice", "Bob")

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Play XYZ (invalid word) via UI
      await gamePage.placeWord(7, 7, "XYZ")
      await gamePage.endTurn()

      // XYZ is on the board
      await gamePage.expectTileAt(7, 7, "X")
      await gamePage.expectTileAt(7, 8, "Y")
      await gamePage.expectTileAt(7, 9, "Z")

      // Bob challenges (successful - XYZ is invalid)
      await gamePage.challengeMove("Alice", 0)
      await expect(page.getByText(/XYZ is not valid/)).toBeVisible()

      // Board should be empty after successful challenge
      expect(await gamePage.cellHasTile(7, 7)).toBe(false)

      // Alice loses her turn (passes), so it should be Bob's turn
      expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

      // Undo the challenge
      await gamePage.clickUndo()

      // XYZ should be back on the board
      await gamePage.expectTileAt(7, 7, "X")
      await gamePage.expectTileAt(7, 8, "Y")
      await gamePage.expectTileAt(7, 9, "Z")

      // It should be Bob's turn again (original state before challenge)
      expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
    })

    test("undo is disabled when there is nothing to undo", async ({ page }) => {
      await seedTwoPlayerGame(page, "Alice", "Bob")

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Undo should be disabled at the start
      expect(await gamePage.isUndoEnabled()).toBe(false)
    })

    test("redo is disabled when there is nothing to redo", async ({ page }) => {
      await seedGameWithMoves(
        page,
        ["Alice", "Bob"],
        [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 7, tile: "C" },
              { row: 7, col: 8, tile: "A" },
              { row: 7, col: 9, tile: "T" },
            ],
          },
        ],
      )

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Redo should be disabled (haven't undone anything)
      expect(await gamePage.isRedoEnabled()).toBe(false)
    })

    test("new action clears the redo stack", async ({ page }) => {
      // Seed an empty game and play move via UI
      await seedTwoPlayerGame(page, "Alice", "Bob")

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Play CAT via UI
      await gamePage.placeWord(7, 7, "CAT")
      await gamePage.endTurn()

      // Undo the move
      await gamePage.clickUndo()
      expect(await gamePage.isRedoEnabled()).toBe(true)

      // Make a new move
      await gamePage.placeWord(7, 7, "DOG")
      await gamePage.endTurn()

      // Redo should now be disabled
      expect(await gamePage.isRedoEnabled()).toBe(false)
    })
  })

  test.describe("Move menu options", () => {
    test("correct and challenge options appear for the last move", async ({ page }) => {
      // Seed a game with two moves
      await seedGameWithMoves(
        page,
        ["Alice", "Bob"],
        [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 7, tile: "C" },
              { row: 7, col: 8, tile: "A" },
              { row: 7, col: 9, tile: "T" },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 6, col: 8, tile: "B" },
              { row: 8, col: 8, tile: "S" },
            ],
          },
        ],
      )

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Open menu on Alice's first move (not the last move)
      await gamePage.openMoveMenu("Alice", 0)

      // Should only see Correct, not Challenge
      await expect(page.getByRole("menuitem", { name: "Correct" })).toBeVisible()
      await expect(page.getByRole("menuitem", { name: "Challenge" })).not.toBeVisible()

      // Close the menu
      await page.keyboard.press("Escape")

      // Open menu on Bob's last move
      await gamePage.openMoveMenu("Bob", 0)

      // Should see Correct and Challenge (no Undo in menu anymore)
      await expect(page.getByRole("menuitem", { name: "Correct" })).toBeVisible()
      await expect(page.getByRole("menuitem", { name: "Challenge" })).toBeVisible()
    })
  })

  test.describe("Challenge", () => {
    test("successful challenge removes invalid word", async ({ page }) => {
      // Seed a game with an invalid word (XYZ is not a valid word)
      await seedGameWithMoves(
        page,
        ["Alice", "Bob"],
        [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 7, tile: "X" },
              { row: 7, col: 8, tile: "Y" },
              { row: 7, col: 9, tile: "Z" },
            ],
          },
        ],
      )

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Verify the word is on the board
      await gamePage.expectTileAt(7, 7, "X")
      await gamePage.expectTileAt(7, 8, "Y")
      await gamePage.expectTileAt(7, 9, "Z")

      // Challenge the move
      await gamePage.challengeMove("Alice", 0)

      // Wait for the toast indicating invalid word
      await expect(page.getByText(/XYZ is not valid/)).toBeVisible()

      // Board should be empty
      expect(await gamePage.cellHasTile(7, 7)).toBe(false)
      expect(await gamePage.cellHasTile(7, 8)).toBe(false)
      expect(await gamePage.cellHasTile(7, 9)).toBe(false)

      // Alice loses her turn (passes), so it should be Bob's turn
      expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
    })

    test("failed challenge shows error toast and records on scoresheet", async ({ page }) => {
      // Seed a game with a valid word (CAT is a valid word)
      await seedGameWithMoves(
        page,
        ["Alice", "Bob"],
        [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 7, tile: "C" },
              { row: 7, col: 8, tile: "A" },
              { row: 7, col: 9, tile: "T" },
            ],
          },
        ],
      )

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Challenge the move
      await gamePage.challengeMove("Alice", 0)

      // Wait for the toast showing all words are valid with definitions
      const toast = page.getByLabel("Notifications alt+T")
      await expect(toast.getByText(/All words are valid/)).toBeVisible()
      await expect(toast.getByText(/CAT/)).toBeVisible()

      // Board should still have the word
      await gamePage.expectTileAt(7, 7, "C")
      await gamePage.expectTileAt(7, 8, "A")
      await gamePage.expectTileAt(7, 9, "T")

      // Bob loses his turn for failed challenge, so it should be Alice's turn
      expect(await gamePage.getCurrentPlayerIndex()).toBe(0)

      // Bob's scoresheet should show the failed challenge with the word
      const bobPanel = page.locator('[role="region"][data-player="Bob"]')
      await expect(bobPanel.getByText(/failed challenge/)).toBeVisible()
      await expect(bobPanel.getByText(/CAT/)).toBeVisible()
    })

    test("challenge option only appears for the last move", async ({ page }) => {
      // Seed a game with two moves
      await seedGameWithMoves(
        page,
        ["Alice", "Bob"],
        [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 7, tile: "C" },
              { row: 7, col: 8, tile: "A" },
              { row: 7, col: 9, tile: "T" },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 6, col: 8, tile: "B" },
              { row: 8, col: 8, tile: "S" },
            ],
          },
        ],
      )

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Open menu on Alice's first move (not the last move)
      await gamePage.openMoveMenu("Alice", 0)

      // Should not see Challenge
      await expect(page.getByRole("menuitem", { name: "Challenge" })).not.toBeVisible()

      // Close the menu
      await page.keyboard.press("Escape")

      // Open menu on Bob's last move
      await gamePage.openMoveMenu("Bob", 0)

      // Should see Challenge
      await expect(page.getByRole("menuitem", { name: "Challenge" })).toBeVisible()
    })

    test("challenge validates cross words too", async ({ page }) => {
      // Seed a game with CAT, then play an invalid cross word
      await seedGameWithMoves(
        page,
        ["Alice", "Bob"],
        [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 7, tile: "C" },
              { row: 7, col: 8, tile: "A" },
              { row: 7, col: 9, tile: "T" },
            ],
          },
          {
            // Play XZ vertically through A - creates invalid word XAZ
            playerIndex: 1,
            tilesPlaced: [
              { row: 6, col: 8, tile: "X" },
              { row: 8, col: 8, tile: "Z" },
            ],
          },
        ],
      )

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Challenge the move
      await gamePage.challengeMove("Bob", 0)

      // Wait for the toast indicating invalid word
      await expect(page.getByText(/is not valid/)).toBeVisible()

      // Bob's tiles should be removed but CAT should remain
      await gamePage.expectTileAt(7, 7, "C")
      await gamePage.expectTileAt(7, 8, "A")
      await gamePage.expectTileAt(7, 9, "T")
      expect(await gamePage.cellHasTile(6, 8)).toBe(false)
      expect(await gamePage.cellHasTile(8, 8)).toBe(false)
    })
  })

  test.describe("Correct", () => {
    test("correct option available for all moves", async ({ page }) => {
      // Seed a game with two moves
      await seedGameWithMoves(
        page,
        ["Alice", "Bob"],
        [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 7, tile: "C" },
              { row: 7, col: 8, tile: "A" },
              { row: 7, col: 9, tile: "T" },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 6, col: 8, tile: "B" },
              { row: 8, col: 8, tile: "S" },
            ],
          },
        ],
      )

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Open menu on Alice's first move
      await gamePage.openMoveMenu("Alice", 0)
      await expect(page.getByRole("menuitem", { name: "Correct" })).toBeVisible()
      await page.keyboard.press("Escape")

      // Open menu on Bob's move
      await gamePage.openMoveMenu("Bob", 0)
      await expect(page.getByRole("menuitem", { name: "Correct" })).toBeVisible()
    })
  })

  test.describe("Pass moves", () => {
    test("pass moves do not show dropdown menu", async ({ page }) => {
      // Seed a game and play a pass move through UI
      await seedTwoPlayerGame(page, "Alice", "Bob")

      const gamePage = new GamePage(page)
      await gamePage.expectOnGameScreen()

      // Play a word first (required for first move)
      await gamePage.placeWord(7, 7, "CAT")
      await gamePage.endTurn()

      // Now pass for Bob
      await gamePage.pass()

      // Try to click on the pass entry
      const passEntry = page
        .locator('[role="region"][data-player]')
        .filter({ hasText: "Bob" })
        .locator(".divide-y > div")
        .first()
      await passEntry.click()

      // No menu should appear (pass moves have no dropdown)
      await expect(page.getByRole("menuitem", { name: "Correct" })).not.toBeVisible({
        timeout: 500,
      })
      await expect(page.getByRole("menuitem", { name: "Challenge" })).not.toBeVisible({
        timeout: 500,
      })
    })
  })
})
