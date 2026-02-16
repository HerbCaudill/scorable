import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"
import { seedTwoPlayerGame } from "../fixtures/seed-game"

test.describe("Blank tile input", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await seedTwoPlayerGame(page)
    gamePage = new GamePage(page)
  })

  test("blank tile dialog accepts letter via button tap", async ({ page }) => {
    // Place C, blank, T at center to make C_T
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("C")
    await gamePage.pressKey(" ") // Place blank tile
    await gamePage.typeLetters("T")

    // Commit the move - should trigger blank letter dialog
    await gamePage.pressKey("Enter")

    // Wait for the blank letter dialog to appear
    const dialog = page.getByRole("dialog", { name: /What letter/ })
    await dialog.waitFor({ state: "visible" })

    // Click the "A" letter button inside the dialog
    const aButton = dialog.getByRole("button", { name: "A", exact: true })
    await aButton.click()

    // The Done button should now be enabled (blank was filled)
    const doneButton = dialog.getByRole("button", { name: "Done" })
    await expect(doneButton).toBeEnabled({ timeout: 2000 })

    // Click Done to confirm
    await doneButton.click()

    // Dialog should close
    await dialog.waitFor({ state: "detached" })

    // The move should be committed - player should have a score
    expect(await gamePage.getPlayerScore(0)).toBeGreaterThan(0)
  })

  test("can complete blank tile entry via hardware keyboard", async ({ page }) => {
    // Place C, blank, T at center to make C_T
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("C")
    await gamePage.pressKey(" ") // Place blank tile
    await gamePage.typeLetters("T")

    // Commit the move - should trigger blank letter dialog
    await gamePage.pressKey("Enter")

    // Wait for the blank letter dialog to appear
    const dialog = page.getByRole("dialog", { name: /What letter/ })
    await dialog.waitFor({ state: "visible" })

    // Type a letter using hardware keyboard
    await page.keyboard.press("A")

    // The Done button should be enabled
    const doneButton = dialog.getByRole("button", { name: "Done" })
    await expect(doneButton).toBeEnabled({ timeout: 2000 })

    // Click Done
    await doneButton.click()
    await dialog.waitFor({ state: "detached" })

    expect(await gamePage.getPlayerScore(0)).toBeGreaterThan(0)
  })
})
