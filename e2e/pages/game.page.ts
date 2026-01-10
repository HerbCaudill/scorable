import { Page, expect, Locator } from "@playwright/test"

export class GamePage {
  private board: Locator

  constructor(private page: Page) {
    this.board = page.getByRole("grid", { name: "Scrabble board" })
  }

  /** Convert column index to letter (A-O) */
  private colToLetter(col: number): string {
    return String.fromCharCode(65 + col)
  }

  /** Get a specific cell on the board (0-indexed row and col) */
  private getCell(row: number, col: number): Locator {
    const label = `${this.colToLetter(col)}${row + 1}`
    return this.page.getByRole("gridcell", { name: label, exact: true })
  }

  /** Get a cell by its label (e.g., "H8") */
  getCellByLabel(label: string): Locator {
    return this.page.getByRole("gridcell", { name: label, exact: true })
  }

  /** Click on a board cell */
  async clickCell(row: number, col: number) {
    await this.getCell(row, col).click()
    // Wait for React to process the click
    await this.page.waitForTimeout(100)
  }

  /** Type letters (places tiles at cursor position) */
  async typeLetters(letters: string) {
    // Blur any focused element so global keyboard listener receives events
    await this.page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    })
    await this.page.keyboard.type(letters)
  }

  /** Press a specific key */
  async pressKey(key: string) {
    // Blur any focused element so global keyboard listener receives events
    await this.page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    })
    await this.page.keyboard.press(key)
  }

  /** Click cell until cursor has desired direction */
  async setCursorDirection(row: number, col: number, direction: "horizontal" | "vertical") {
    await this.clickCell(row, col)
    const currentDirection = await this.getCursorDirection()
    if (currentDirection !== direction) {
      await this.clickCell(row, col) // Toggle direction
    }
  }

  /** Get the cursor direction from the selected cell */
  async getCursorDirection(): Promise<"horizontal" | "vertical" | null> {
    const selectedCell = this.page.locator('[aria-selected="true"]')
    if (!(await selectedCell.isVisible())) return null
    const direction = await selectedCell.getAttribute("data-cursor-direction")
    return direction as "horizontal" | "vertical" | null
  }

  /** Expect cursor to have specific direction */
  async expectCursorDirection(direction: "horizontal" | "vertical") {
    const selectedCell = this.page.locator('[aria-selected="true"]')
    await expect(selectedCell).toHaveAttribute("data-cursor-direction", direction)
  }

  /** Place a word starting at a position */
  async placeWord(
    startRow: number,
    startCol: number,
    word: string,
    direction: "horizontal" | "vertical" = "horizontal",
  ) {
    await this.setCursorDirection(startRow, startCol, direction)
    await this.typeLetters(word)
  }

  /** End the current turn by clicking on the active player panel */
  async endTurn() {
    // Find the active player panel (has aria-current="true") and click it
    const activePanel = this.page.locator('[aria-current="true"]')
    const clickableRow = activePanel.locator(".cursor-pointer").first()
    await clickableRow.click()
  }

  /** Click on a player panel to end turn */
  async clickPlayerPanel(playerIndex: number) {
    const panels = this.page.locator('[role="region"][data-player]')
    await panels.nth(playerIndex).locator(".cursor-pointer").first().click()
  }

  /** Toggle the timer (start/pause) */
  async toggleTimer() {
    // Dismiss mobile keyboard if visible by pressing Escape
    await this.pressKey("Escape")
    // Button text: "Timer" (never used) -> "Pause" (running) -> "Resume" (paused)
    const timerButton = this.page.getByRole("button", { name: "Timer" })
    const pauseButton = this.page.getByRole("button", { name: "Pause" })
    const resumeButton = this.page.getByRole("button", { name: "Resume" })

    if (await timerButton.isVisible()) {
      await timerButton.click()
    } else if (await resumeButton.isVisible()) {
      await resumeButton.click()
    } else {
      await pauseButton.click()
    }
  }

  /** Check if timer is running */
  async isTimerRunning() {
    return this.page.getByRole("button", { name: "Pause" }).isVisible()
  }

  /** Open the tile bag screen */
  async openTileBag() {
    // Dismiss mobile keyboard if visible by pressing Escape
    await this.pressKey("Escape")
    await this.page.getByRole("button", { name: /Tiles/ }).click()
  }

  /** Click the end game button */
  async clickEndGame() {
    // Dismiss mobile keyboard if visible by pressing Escape
    await this.pressKey("Escape")
    await this.page.getByRole("button", { name: "End game" }).click()
  }

  /** Confirm the pass dialog */
  async confirmPass() {
    await this.page.getByRole("button", { name: "Pass" }).click()
  }

  /** Confirm the end game dialog and complete the EndGameScreen flow */
  async confirmEndGame() {
    // In the early-end dialog, click the "End game" button
    await this.page.getByRole("alertdialog").getByRole("button", { name: "End game" }).click()
    // This takes us to the EndGameScreen - click apply to complete the flow
    await this.applyAndEndGame()
  }

  /** Cancel a dialog */
  async cancelDialog() {
    await this.page.getByRole("button", { name: "Cancel" }).click()
  }

  /** Get the score for a player */
  async getPlayerScore(playerIndex: number): Promise<number> {
    const panels = this.page.locator('[role="region"][data-player]')
    const panel = panels.nth(playerIndex)
    const scoreText = await panel.locator(".text-2xl.font-bold").textContent()
    return parseInt(scoreText || "0", 10)
  }

  /** Get the current player index based on aria-current */
  async getCurrentPlayerIndex(): Promise<number> {
    const panels = this.page.locator('[role="region"][data-player]')
    const count = await panels.count()
    for (let i = 0; i < count; i++) {
      const ariaCurrent = await panels.nth(i).getAttribute("aria-current")
      if (ariaCurrent === "true") {
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
    const cell = this.getCell(row, col)
    const hasTile = await cell.getAttribute("data-has-tile")
    return hasTile === "true"
  }

  /** Expect a tile at a specific position */
  async expectTileAt(row: number, col: number, letter: string) {
    await expect(this.getCell(row, col)).toContainText(letter)
  }

  /** Expect a cell to be selected (cursor on it) */
  async expectCellSelected(row: number, col: number) {
    await expect(this.getCell(row, col)).toHaveAttribute("aria-selected", "true")
  }

  /** Expect a cell to have a new tile (placed in current turn) */
  async expectNewTileAt(row: number, col: number) {
    await expect(this.getCell(row, col)).toHaveAttribute("data-tile-state", "new")
  }

  /** Get timer element for a player */
  getPlayerTimer(playerIndex: number): Locator {
    const panels = this.page.locator('[role="region"][data-player]')
    return panels.nth(playerIndex).getByRole("timer")
  }

  /** Expect the game screen to be visible */
  async expectOnGameScreen() {
    await expect(this.board).toBeVisible()
  }

  /** Expect player name to be visible */
  async expectPlayerName(name: string) {
    await expect(this.page.getByText(name)).toBeVisible()
  }

  /** Expect a dialog to be visible */
  async expectDialogWithTitle(title: string) {
    await expect(this.page.getByRole("alertdialog")).toContainText(title)
  }

  /** Expect an error toast */
  async expectErrorToast(message: string) {
    await expect(this.page.getByText(message)).toBeVisible()
  }

  // End Game Screen methods

  /** Expect the end game screen to be visible */
  async expectOnEndGameScreen() {
    await expect(this.page.getByRole("heading", { name: "End Game" })).toBeVisible()
  }

  /** Select who ended the game */
  async selectPlayerWhoEndedGame(playerName: string) {
    await this.page.getByRole("button", { name: playerName }).click()
  }

  /** Select "Nobody (blocked)" for blocked games */
  async selectNobodyEndedGame() {
    await this.page.getByRole("button", { name: "Nobody (blocked)" }).click()
  }

  /** Get the player section by finding the element containing the player's name */
  private getPlayerSection(playerName: string) {
    // Find the section that contains the player name - it's a div with rounded-lg border p-3 classes
    // Use filter to find the one containing the specific player name
    return this.page.locator("div.rounded-lg.border.p-3").filter({ hasText: playerName })
  }

  /** Focus the rack input for a player and type tiles */
  async enterRackTiles(playerName: string, tiles: string) {
    const playerSection = this.getPlayerSection(playerName)
    // Click the focusable container (tabindex=0) within the player section
    const input = playerSection.locator('[tabindex="0"]')
    await input.click()
    await this.page.keyboard.type(tiles)
  }

  /** Clear rack tiles for a player using backspace */
  async clearRackTiles(playerName: string, count: number) {
    const playerSection = this.getPlayerSection(playerName)
    // Click on the focusable container to give it focus
    const input = playerSection.locator('[tabindex="0"]')
    await input.click()
    // Wait for focus to be established
    await input.focus()
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press("Backspace")
    }
  }

  /** Get the adjustment value shown for a player */
  async getPlayerAdjustment(playerName: string): Promise<string> {
    const playerSection = this.getPlayerSection(playerName)
    // The adjustment is shown with tabular-nums class for alignment
    const adjustment = playerSection.locator(".tabular-nums")
    return (await adjustment.textContent()) || ""
  }

  /** Click Apply & End Game button */
  async applyAndEndGame() {
    await this.page.getByRole("button", { name: "Apply & End Game" }).click()
  }

  /** Click Cancel on end game screen */
  async cancelEndGame() {
    await this.page.getByRole("button", { name: "Cancel" }).click()
  }

  /** Check if Apply & End Game button is disabled */
  async isApplyButtonDisabled(): Promise<boolean> {
    return this.page.getByRole("button", { name: "Apply & End Game" }).isDisabled()
  }

  /** Expect validation error for a player */
  async expectRackError(playerName: string, errorText: string) {
    const playerSection = this.getPlayerSection(playerName)
    await expect(playerSection).toContainText(errorText)
  }

  /** Check if a player is shown as "ended the game" */
  async expectPlayerEndedGame(playerName: string) {
    const playerSection = this.getPlayerSection(playerName)
    await expect(playerSection).toContainText("ended the game")
  }

  // Move Correction methods

  /** Get the move history entries for a player */
  private getPlayerMoveHistory(playerName: string) {
    const panel = this.page.locator('[role="region"][data-player]').filter({ hasText: playerName })
    return panel.locator(".divide-y > div")
  }

  /** Click on a move in a player's history to open the action menu, then select Correct */
  async longPressMove(playerName: string, moveIndex: number) {
    await this.openMoveMenu(playerName, moveIndex)
    await this.page.getByRole("menuitem", { name: "Correct" }).click()
  }

  /** Open the action menu for a move */
  async openMoveMenu(playerName: string, moveIndex: number) {
    const entries = this.getPlayerMoveHistory(playerName)
    const entry = entries.nth(moveIndex)
    await entry.click()
  }

  /** Click the global undo button */
  async clickUndo() {
    // Dismiss mobile keyboard if visible by pressing Escape
    await this.pressKey("Escape")
    await this.page.getByRole("button", { name: "Undo" }).click()
  }

  /** Click the global redo button */
  async clickRedo() {
    // Dismiss mobile keyboard if visible by pressing Escape
    await this.pressKey("Escape")
    await this.page.getByRole("button", { name: "Redo" }).click()
  }

  /** Check if undo button is enabled */
  async isUndoEnabled(): Promise<boolean> {
    return this.page.getByRole("button", { name: "Undo" }).isEnabled()
  }

  /** Check if redo button is enabled */
  async isRedoEnabled(): Promise<boolean> {
    return this.page.getByRole("button", { name: "Redo" }).isEnabled()
  }

  /** Select challenge from the move action menu */
  async challengeMove(playerName: string, moveIndex: number) {
    await this.openMoveMenu(playerName, moveIndex)
    await this.page.getByRole("menuitem", { name: "Challenge" }).click()
  }

  /** Expect the app to be in edit mode */
  async expectInEditMode() {
    await expect(this.page.getByText("Editing move")).toBeVisible()
  }

  /** Expect the app to not be in edit mode */
  async expectNotInEditMode() {
    await expect(this.page.getByText("Editing move")).not.toBeVisible()
  }

  /** Click cancel button during edit mode */
  async cancelEdit() {
    // Dismiss mobile keyboard if visible by pressing Escape
    await this.pressKey("Escape")
    await this.page.getByRole("button", { name: "Cancel" }).click()
  }

  /** Click save edit button */
  async saveEdit() {
    // Dismiss mobile keyboard if visible by pressing Escape
    await this.pressKey("Escape")
    await this.page.getByRole("button", { name: "Save edit" }).click()
  }

  /** Get the current URL hash */
  async getUrlHash(): Promise<string> {
    return this.page.evaluate(() => window.location.hash)
  }
}
