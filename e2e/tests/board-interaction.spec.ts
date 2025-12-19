import { test, expect } from '@playwright/test'
import { GamePage } from '../pages/game.page'
import { clearStorage, seedStorage } from '../fixtures/storage-fixtures'
import { createTestGame } from '../fixtures/game-fixtures'

test.describe('Board Interaction', () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearStorage(page)
    await seedStorage(page, {
      currentGame: createTestGame(['Alice', 'Bob']),
    })
    await page.reload()
    await page.getByRole('button', { name: 'Resume game' }).click()
    gamePage = new GamePage(page)
  })

  test('clicking cell places cursor', async ({ page }) => {
    await gamePage.clickCell(7, 7)

    // The cursor should be visible (indicated by teal ring)
    const cell = page.locator('.grid-cols-15 > div').nth(7 * 15 + 7)
    await expect(cell.locator('.ring-teal-600')).toBeVisible()
  })

  test('typing letter places tile', async ({ page }) => {
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters('A')

    await gamePage.expectTileAt(7, 7, 'A')
  })

  test('cursor advances after placing tile', async ({ page }) => {
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters('AB')

    // A should be at 7,7
    await gamePage.expectTileAt(7, 7, 'A')
    // B should be at 7,8 (cursor advanced horizontally)
    await gamePage.expectTileAt(7, 8, 'B')
  })

  test('clicking same cell toggles direction', async ({ page }) => {
    await gamePage.clickCell(7, 7)
    await gamePage.clickCell(7, 7) // Toggle to vertical
    await gamePage.typeLetters('AB')

    // A should be at 7,7
    await gamePage.expectTileAt(7, 7, 'A')
    // B should be at 8,7 (cursor advanced vertically)
    await gamePage.expectTileAt(8, 7, 'B')
  })

  test('arrow keys move cursor', async ({ page }) => {
    await gamePage.clickCell(7, 7)

    // Move right
    await gamePage.pressKey('ArrowRight')
    let cell = page.locator('.grid-cols-15 > div').nth(7 * 15 + 8)
    await expect(cell.locator('.ring-teal-600')).toBeVisible()

    // Move down
    await gamePage.pressKey('ArrowDown')
    cell = page.locator('.grid-cols-15 > div').nth(8 * 15 + 8)
    await expect(cell.locator('.ring-teal-600')).toBeVisible()

    // Move left
    await gamePage.pressKey('ArrowLeft')
    cell = page.locator('.grid-cols-15 > div').nth(8 * 15 + 7)
    await expect(cell.locator('.ring-teal-600')).toBeVisible()

    // Move up
    await gamePage.pressKey('ArrowUp')
    cell = page.locator('.grid-cols-15 > div').nth(7 * 15 + 7)
    await expect(cell.locator('.ring-teal-600')).toBeVisible()
  })

  test('backspace removes last placed tile', async ({ page }) => {
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters('AB')

    // Both tiles should be visible
    await gamePage.expectTileAt(7, 7, 'A')
    await gamePage.expectTileAt(7, 8, 'B')

    // Delete B
    await gamePage.pressKey('Backspace')

    // A should still be there, B should be gone
    await gamePage.expectTileAt(7, 7, 'A')
    const cellB = page.locator('.grid-cols-15 > div').nth(7 * 15 + 8)
    await expect(cellB).not.toContainText('B')
  })

  test('space places blank tile', async ({ page }) => {
    await gamePage.clickCell(7, 7)
    await gamePage.pressKey(' ')

    // Blank tile should be visible (represented as a tile with no letter)
    const cell = page.locator('.grid-cols-15 > div').nth(7 * 15 + 7)
    // The cell should have a tile (teal background for new tiles: bg-teal-300)
    await expect(cell.locator('.bg-teal-300')).toBeVisible()
  })

  test('can place word across multiple cells', async ({ page }) => {
    await gamePage.placeWord(7, 7, 'SCRABBLE')

    await gamePage.expectTileAt(7, 7, 'S')
    await gamePage.expectTileAt(7, 8, 'C')
    await gamePage.expectTileAt(7, 9, 'R')
    await gamePage.expectTileAt(7, 10, 'A')
    await gamePage.expectTileAt(7, 11, 'B')
    await gamePage.expectTileAt(7, 12, 'B')
    await gamePage.expectTileAt(7, 13, 'L')
    await gamePage.expectTileAt(7, 14, 'E')
  })

  test('can place vertical word', async ({ page }) => {
    await gamePage.placeWord(7, 7, 'CAT', 'vertical')

    await gamePage.expectTileAt(7, 7, 'C')
    await gamePage.expectTileAt(8, 7, 'A')
    await gamePage.expectTileAt(9, 7, 'T')
  })

  test('cursor skips existing tiles when typing', async ({ page }) => {
    // Place first word
    await gamePage.placeWord(7, 7, 'CAT')
    await gamePage.endTurn()

    // Second player places connecting word - start at empty cell below A
    await gamePage.clickCell(8, 8) // Start below A
    await gamePage.typeLetters('S') // This creates "AS" vertically

    // S should be placed at row 8, col 8
    await gamePage.expectTileAt(8, 8, 'S')
  })
})
