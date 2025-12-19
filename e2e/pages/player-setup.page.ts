import { Page, expect } from '@playwright/test'

export class PlayerSetupPage {
  constructor(private page: Page) {}

  /** Click on a player slot to open the dropdown */
  async clickPlayerSlot(slotIndex: number) {
    // Player slots have "1. player name", "2. player name", etc.
    await this.page.locator('.border-dashed, .border-solid').nth(slotIndex).click()
  }

  /** Select an existing player from the dropdown */
  async selectExistingPlayer(slotIndex: number, playerName: string) {
    await this.clickPlayerSlot(slotIndex)
    await this.page.getByRole('menuitem', { name: playerName }).click()
  }

  /** Add a new player by name */
  async addNewPlayer(slotIndex: number, playerName: string) {
    await this.clickPlayerSlot(slotIndex)
    await this.page.getByRole('menuitem', { name: 'New...' }).click()
    await this.page.getByPlaceholder('Enter name...').fill(playerName)
    await this.page.getByRole('button', { name: 'Add' }).click()
  }

  /** Clear a selected player */
  async clearPlayer(slotIndex: number) {
    await this.page.getByLabel('Clear player').nth(slotIndex).click()
  }

  /** Click the start game button */
  async startGame() {
    await this.page.getByRole('button', { name: 'Start game' }).click()
  }

  /** Check if start game button is enabled */
  async isStartGameEnabled() {
    return this.page.getByRole('button', { name: 'Start game' }).isEnabled()
  }

  /** Go back to home screen */
  async goBack() {
    await this.page.getByRole('button', { name: 'Back' }).click()
  }

  /** Verify player is shown in a slot */
  async expectPlayerInSlot(slotIndex: number, playerName: string) {
    await expect(this.page.getByText(`${slotIndex + 1}. ${playerName}`)).toBeVisible()
  }
}
