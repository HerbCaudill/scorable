import { Page, expect } from '@playwright/test'

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/')
  }

  async clickNewGame() {
    await this.page.getByRole('button', { name: 'New game' }).click()
    // Wait for player setup screen to appear (has "Start game" button)
    await this.page.getByRole('button', { name: 'Start game' }).waitFor({ state: 'visible' })
  }

  async clickResumeGame() {
    await this.page.getByRole('button', { name: 'Resume game' }).click()
  }

  async isResumeGameVisible() {
    return this.page.getByRole('button', { name: 'Resume game' }).isVisible()
  }

  async clickPastGame(index: number) {
    await this.page.locator('.cursor-pointer').nth(index).click()
  }

  async getPastGamesCount() {
    return this.page.locator('.cursor-pointer').count()
  }

  async expectOnHomeScreen() {
    await expect(this.page.getByRole('button', { name: 'New game' })).toBeVisible()
  }
}
