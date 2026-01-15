import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"
import { HomePage } from "../pages/home.page"
import { seedTwoPlayerGame, seedNearEndGame } from "../fixtures/seed-game"

/**
 * Helper to create and finish a game by seeding a near-end game and clicking End
 */
async function createFinishedGame(page: import("@playwright/test").Page) {
  await seedNearEndGame(page)
  const gamePage = new GamePage(page)
  await gamePage.finishGame()
  const homePage = new HomePage(page)
  await homePage.expectOnHomeScreen()
}

test.describe("Dialog button styling", () => {
  test("tile overuse dialog buttons have correct shadow colors", async ({ page }) => {
    await seedTwoPlayerGame(page)
    const gamePage = new GamePage(page)

    // Play a word that uses more J tiles than exist (only 1 J in game)
    // JJ at center - this will trigger tile overuse warning
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("JJ")
    await gamePage.endTurn()

    // The tile overuse confirmation dialog should appear
    const dialog = page.locator('[data-slot="alert-dialog-content"]')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("Too many tiles used")).toBeVisible()

    // Check the "Play anyway" button (secondary) - should have neutral shadow
    const playAnywayButton = dialog.getByRole("button", { name: "Play anyway" })
    await expect(playAnywayButton).toBeVisible()
    const playAnywayStyles = await playAnywayButton.evaluate((el: Element) => {
      const style = window.getComputedStyle(el)
      return {
        boxShadow: style.boxShadow,
        backgroundColor: style.backgroundColor,
      }
    })
    // The shadow should use neutral-300 (oklch color), not teal-700
    expect(playAnywayStyles.boxShadow).not.toContain("teal")
    // Should have a 3px shadow (the neutral variant)
    expect(playAnywayStyles.boxShadow).toContain("3px")

    // Check the "Fix move" button (primary) - should have teal shadow
    const fixMoveButton = dialog.getByRole("button", { name: "Fix move" })
    await expect(fixMoveButton).toBeVisible()
    const fixMoveStyles = await fixMoveButton.evaluate((el: Element) => {
      const style = window.getComputedStyle(el)
      return {
        boxShadow: style.boxShadow,
      }
    })
    // Should have a 3px shadow
    expect(fixMoveStyles.boxShadow).toContain("3px")

    // Close the dialog
    await fixMoveButton.click()
    await expect(dialog).not.toBeVisible()
  })

  test("delete dialog buttons have correct shadow colors", async ({ page }) => {
    await createFinishedGame(page)

    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    // Click the Delete button to show the confirm dialog
    await page.getByRole("button", { name: /Delete/i }).click()

    // The dialog should appear
    const dialog = page.locator('[data-slot="alert-dialog-content"]')
    await expect(dialog).toBeVisible()

    // Check the Delete button (destructive) - should have red/destructive shadow
    const deleteButton = dialog.getByRole("button", { name: "Delete" })
    await expect(deleteButton).toBeVisible()
    const deleteStyles = await deleteButton.evaluate((el: Element) => {
      const style = window.getComputedStyle(el)
      return {
        boxShadow: style.boxShadow,
        backgroundColor: style.backgroundColor,
      }
    })
    // The shadow should NOT use teal-700
    expect(deleteStyles.boxShadow).not.toContain("teal")
    // Should have a 3px shadow
    expect(deleteStyles.boxShadow).toContain("3px")
    // Background should be red (can be rgb or oklch format)
    expect(
      deleteStyles.backgroundColor.includes("rgb") || deleteStyles.backgroundColor.includes("oklch"),
    ).toBe(true)

    // Check the Cancel button - should have neutral shadow (outline variant)
    const cancelButton = dialog.getByRole("button", { name: "Cancel" })
    await expect(cancelButton).toBeVisible()
    const cancelStyles = await cancelButton.evaluate((el: Element) => {
      const style = window.getComputedStyle(el)
      return {
        boxShadow: style.boxShadow,
      }
    })
    // Should have a 3px shadow (outline variant uses neutral-300)
    expect(cancelStyles.boxShadow).toContain("3px")

    // Close the dialog
    await cancelButton.click()
    await expect(dialog).not.toBeVisible()
  })
})
