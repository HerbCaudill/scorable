import { Page, expect } from "@playwright/test"

export class PlayerSetupPage {
  constructor(private page: Page) {}

  /** Click on a player slot to open the dropdown (if not already expanded) */
  async clickPlayerSlot(slotIndex: number) {
    // Player slots have "1. player name", "2. player name", etc.
    const slot = this.page.locator(".border-dashed, .border-solid").nth(slotIndex)
    // Check if this slot's dropdown is already open via aria-expanded
    const isExpanded = await slot.getAttribute("aria-expanded").catch(() => null)
    if (isExpanded === "true") {
      return // Already open, don't toggle it closed
    }
    await slot.click()
  }

  /** Select an existing player from the dropdown */
  async selectExistingPlayer(slotIndex: number, playerName: string) {
    await this.clickPlayerSlot(slotIndex)
    await this.page.getByRole("menu").waitFor({ state: "visible" })
    await this.page.getByRole("menuitem", { name: playerName }).click()
  }

  /** Add a new player by name */
  async addNewPlayer(slotIndex: number, playerName: string) {
    await this.clickPlayerSlot(slotIndex)
    await this.page.getByRole("menu").waitFor({ state: "visible" })
    // If no previous players are available, the input is shown directly
    // Otherwise, we need to click "New..." first
    const newMenuItem = this.page.getByRole("menuitem", { name: "New..." })
    if (await newMenuItem.isVisible()) {
      await newMenuItem.click()
    }
    // Target the input within the visible dropdown content
    const input = this.page.getByPlaceholder("Enter name...").first()
    await input.waitFor({ state: "visible" })
    // Click to focus, then fill
    await input.click()
    await input.fill(playerName)
    await this.page.getByRole("button", { name: "Add" }).click()
    // Wait for the player to appear in the slot (confirms the add was successful)
    await this.page.getByText(`${slotIndex + 1}. ${playerName}`).waitFor({ state: "visible" })
  }

  /** Clear a selected player */
  async clearPlayer(slotIndex: number) {
    await this.page.getByLabel("Clear player").nth(slotIndex).click()
  }

  /** Click the start game button */
  async startGame() {
    await this.page.getByRole("button", { name: "Start game" }).click()
  }

  /** Check if start game button is enabled */
  async isStartGameEnabled() {
    return this.page.getByRole("button", { name: "Start game" }).isEnabled()
  }

  /** Go back to home screen */
  async goBack() {
    await this.page.getByRole("button", { name: "Back" }).click()
  }

  /** Verify player is shown in a slot */
  async expectPlayerInSlot(slotIndex: number, playerName: string) {
    await expect(this.page.getByText(`${slotIndex + 1}. ${playerName}`)).toBeVisible()
  }
}
