import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"
import { seedTwoPlayerGame } from "../fixtures/seed-game"

test.describe("Pass turn", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await seedTwoPlayerGame(page)
    gamePage = new GamePage(page)
  })

  test("shows confirmation dialog when passing with no tiles", async () => {
    // Press Enter without placing tiles
    await gamePage.clickCell(7, 7) // Need to focus the board first
    await gamePage.endTurn()

    // Should show pass confirmation
    await gamePage.expectDialogWithTitle("Pass turn?")
  })

  test("confirming pass advances turn", async () => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob's turn (index 1)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

    // Pass turn
    await gamePage.clickCell(0, 0) // Focus board
    await gamePage.endTurn()
    await gamePage.confirmPass()

    // Should now be Alice's turn (index 0)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
  })

  test("canceling pass dialog keeps same player", async () => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob's turn (index 1)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

    // Try to pass but cancel
    await gamePage.clickCell(0, 0)
    await gamePage.endTurn()
    await gamePage.cancelDialog()

    // Should still be Bob's turn
    expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
  })

  test("passing does not change score", async () => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    const scoreBefore = await gamePage.getPlayerScore(1)

    // Pass turn
    await gamePage.clickCell(0, 0)
    await gamePage.endTurn()
    await gamePage.confirmPass()

    // After passing, check score on next turn
    await gamePage.clickCell(0, 0)
    await gamePage.endTurn()
    await gamePage.confirmPass()

    // Bob's score should still be 0
    const scoreAfter = await gamePage.getPlayerScore(1)
    expect(scoreAfter).toBe(scoreBefore)
  })

  test("pass is recorded in move history", async ({ page }) => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob passes
    await gamePage.clickCell(0, 0)
    await gamePage.endTurn()
    await gamePage.confirmPass()

    // "(pass)" should appear in move history
    await expect(page.getByText("(pass)")).toBeVisible()
  })

  test("clicking player timer without tiles shows pass dialog", async () => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Click on the next player's timer to end turn
    await gamePage.clickPlayerTimer(0) // Click Alice's timer (next player)

    // Should show pass confirmation
    await gamePage.expectDialogWithTitle("Pass turn?")
  })
})
