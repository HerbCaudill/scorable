import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"
import { seedTwoPlayerGame } from "../fixtures/seed-game"

test.describe("Pass turn", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await seedTwoPlayerGame(page)
    gamePage = new GamePage(page)
  })

  test("pressing Enter with no tiles passes turn", async () => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob's turn (index 1)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

    // Press Enter without placing tiles - should pass directly
    await gamePage.clickCell(0, 0) // Focus board
    await gamePage.endTurn()

    // Should now be Alice's turn (index 0)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
  })

  test("passing does not change score", async () => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    const scoreBefore = await gamePage.getPlayerScore(1)

    // Pass turn (no tiles placed, press Enter)
    await gamePage.clickCell(0, 0)
    await gamePage.endTurn()

    // After passing, Alice passes too
    await gamePage.clickCell(0, 0)
    await gamePage.endTurn()

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

    // "(pass)" should appear in move history
    await expect(page.getByText("(pass)")).toBeVisible()
  })

  test("clicking player panel without tiles passes turn", async () => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob's turn (index 1)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

    // Click on Alice's panel (next player) to pass
    await gamePage.clickPlayerPanel(0)

    // Should now be Alice's turn (index 0)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
  })

  test("Pass button immediately passes turn", async () => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob's turn (index 1)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(1)

    // Click Pass button - should pass immediately (no dialog)
    await gamePage.pass()

    // Should now be Alice's turn (index 0)
    expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
  })

  test("Pass button works for consecutive passes", async () => {
    // Alice places first word
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob passes using button
    await gamePage.pass()
    expect(await gamePage.getCurrentPlayerIndex()).toBe(0)

    // Alice passes using button
    await gamePage.pass()
    expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
  })
})
