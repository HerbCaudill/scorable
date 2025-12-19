import { Page, expect } from '@playwright/test'

export class PastGamePage {
  constructor(private page: Page) {}

  /** Go back to home screen */
  async goBack() {
    await this.page.getByRole('button', { name: 'Back' }).click()
  }

  /** Get the score for a player */
  async getPlayerScore(playerIndex: number): Promise<number> {
    const scoreElements = this.page.locator('.text-2xl.font-bold')
    const scoreText = await scoreElements.nth(playerIndex).textContent()
    return parseInt(scoreText || '0', 10)
  }

  /** Expect to be on the past game screen */
  async expectOnPastGameScreen() {
    await expect(this.page.getByRole('button', { name: 'Back' })).toBeVisible()
    await expect(this.page.locator('.grid-cols-15')).toBeVisible()
  }

  /** Expect a player name to be visible */
  async expectPlayerName(name: string) {
    await expect(this.page.getByText(name)).toBeVisible()
  }
}
