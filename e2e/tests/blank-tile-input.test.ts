import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"
import { seedTwoPlayerGame } from "../fixtures/seed-game"

test.describe("Blank tile input", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    // Inject touch support before app loads so isMobile detection returns true
    await page.addInitScript(() => {
      Object.defineProperty(window, "ontouchstart", { value: null, writable: true })
      Object.defineProperty(navigator, "maxTouchPoints", { value: 1, writable: true })
    })
    await seedTwoPlayerGame(page)
    gamePage = new GamePage(page)
  })

  test("blank tile dialog accepts letter via mobile keyboard tap", async ({ page }) => {
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

    // Find the "A" button on the dialog's mobile keyboard and simulate a tap
    // MobileKeyboard ignores mousedown when touch is available, so we dispatch
    // a touchstart event directly. Use Event since Touch API isn't available in
    // desktop Firefox.
    const letterRegistered = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll("button"))
      const aButtons = allButtons.filter(b => b.textContent?.trim() === "A")
      const aButton = aButtons[aButtons.length - 1]
      if (!aButton) return "no button found"

      // Dispatch a touchstart event - React will handle it via its event system
      const event = new Event("touchstart", { bubbles: true, cancelable: true })
      aButton.dispatchEvent(event)
      return "dispatched"
    })

    expect(letterRegistered).toBe("dispatched")

    // The dialog should still be open
    await expect(dialog).toBeVisible()

    // The Done button should now be enabled (blank was filled)
    const doneButton = dialog.getByRole("button", { name: "Done" })
    await expect(doneButton).toBeEnabled({ timeout: 2000 })

    // Click Done to confirm (using force since overlay may intercept)
    await doneButton.click({ force: true })

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

    // Type a letter using hardware keyboard (not mobile keyboard)
    await page.keyboard.press("A")

    // The Done button should be enabled
    const doneButton = dialog.getByRole("button", { name: "Done" })
    await expect(doneButton).toBeEnabled({ timeout: 2000 })

    // Click Done
    await doneButton.click({ force: true })
    await dialog.waitFor({ state: "detached" })

    expect(await gamePage.getPlayerScore(0)).toBeGreaterThan(0)
  })
})
