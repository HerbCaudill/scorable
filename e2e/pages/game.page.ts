import { Page, expect, Locator } from '@playwright/test'

export class GamePage {
  private boardContainer: Locator
  private boardGrid: Locator

  constructor(private page: Page) {
    // The outer container has tabIndex=0 and receives keyboard events
    this.boardContainer = page.locator('.\\@container[tabindex="0"]')
    // The inner grid has the cells
    this.boardGrid = page.locator('.grid-cols-15')
  }

  /** Get a specific cell on the board (0-indexed row and col) */
  private getCell(row: number, col: number): Locator {
    const index = row * 15 + col
    return this.boardGrid.locator('> div').nth(index)
  }

  /** Click on a board cell */
  async clickCell(row: number, col: number) {
    await this.getCell(row, col).click()
  }

  /** Type letters (places tiles at cursor position) */
  async typeLetters(letters: string) {
    await this.page.keyboard.type(letters)
  }

  /** Press a specific key */
  async pressKey(key: string) {
    await this.page.keyboard.press(key)
  }

  /** Place a word starting at a position */
  async placeWord(startRow: number, startCol: number, word: string, direction: 'horizontal' | 'vertical' = 'horizontal') {
    await this.clickCell(startRow, startCol)
    // If we need vertical, click again to toggle direction
    if (direction === 'vertical') {
      await this.clickCell(startRow, startCol)
    }
    await this.typeLetters(word)
  }

  /** End the current turn by clicking on the active player panel */
  async endTurn() {
    // Find the active player panel (has 3px box-shadow) and click it
    // The active player's container has style containing "3px"
    const panels = this.page.locator('.min-w-32')
    const count = await panels.count()

    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i)
      const style = await panel.getAttribute('style')
      if (style && style.includes('3px')) {
        // Click the player info row (gap-3 div) inside this panel
        const clickableRow = panel.locator('.cursor-pointer.gap-3').first()
        await clickableRow.click()
        return
      }
    }

    // Fallback: click the first player's info row
    await panels.first().locator('.cursor-pointer.gap-3').first().click()
  }

  /** Click on a player panel to end turn */
  async clickPlayerPanel(playerIndex: number) {
    // Click the player info row (with timer), not the whole panel
    await this.page.locator('.min-w-32').nth(playerIndex).locator('.cursor-pointer.gap-3').click()
  }

  /** Toggle the timer (start/pause) */
  async toggleTimer() {
    // Button text changes between "Start timer" and "Pause timer"
    const startButton = this.page.getByRole('button', { name: 'Start timer' })
    const pauseButton = this.page.getByRole('button', { name: 'Pause timer' })

    if (await startButton.isVisible()) {
      await startButton.click()
    } else {
      await pauseButton.click()
    }
  }

  /** Check if timer is running */
  async isTimerRunning() {
    return this.page.getByRole('button', { name: 'Pause timer' }).isVisible()
  }

  /** Open the tile bag screen */
  async openTileBag() {
    await this.page.getByRole('button', { name: /Tiles/ }).click()
  }

  /** Click the end game button */
  async clickEndGame() {
    await this.page.getByRole('button', { name: 'End game' }).click()
  }

  /** Confirm the pass dialog */
  async confirmPass() {
    await this.page.getByRole('button', { name: 'Pass' }).click()
  }

  /** Confirm the end game dialog */
  async confirmEndGame() {
    // In the dialog, click the "End game" button
    await this.page.getByRole('alertdialog').getByRole('button', { name: 'End game' }).click()
  }

  /** Cancel a dialog */
  async cancelDialog() {
    await this.page.getByRole('button', { name: 'Cancel' }).click()
  }

  /** Get the score for a player */
  async getPlayerScore(playerIndex: number): Promise<number> {
    const panel = this.page.locator('.min-w-32').nth(playerIndex)
    const scoreText = await panel.locator('.text-2xl.font-bold').textContent()
    return parseInt(scoreText || '0', 10)
  }

  /** Get the current player index based on active styling */
  async getCurrentPlayerIndex(): Promise<number> {
    const panels = this.page.locator('.min-w-32')
    const count = await panels.count()
    for (let i = 0; i < count; i++) {
      const style = await panels.nth(i).getAttribute('style')
      // Active player has a thicker box-shadow (3px) - check for "3px" in the style
      if (style && style.includes('3px')) {
        return i
      }
    }
    return -1
  }

  /** Get the content of a cell */
  async getCellContent(row: number, col: number): Promise<string | null> {
    return this.getCell(row, col).textContent()
  }

  /** Check if a cell has a tile */
  async cellHasTile(row: number, col: number): Promise<boolean> {
    const content = await this.getCellContent(row, col)
    // Cells with tiles will have the letter visible
    return content !== null && content.trim().length > 0
  }

  /** Expect a tile at a specific position */
  async expectTileAt(row: number, col: number, letter: string) {
    await expect(this.getCell(row, col)).toContainText(letter)
  }

  /** Expect the game screen to be visible */
  async expectOnGameScreen() {
    await expect(this.boardGrid).toBeVisible()
  }

  /** Expect player name to be visible */
  async expectPlayerName(name: string) {
    await expect(this.page.getByText(name)).toBeVisible()
  }

  /** Expect a dialog to be visible */
  async expectDialogWithTitle(title: string) {
    await expect(this.page.getByRole('alertdialog')).toContainText(title)
  }

  /** Expect an error toast */
  async expectErrorToast(message: string) {
    await expect(this.page.getByText(message)).toBeVisible()
  }
}
