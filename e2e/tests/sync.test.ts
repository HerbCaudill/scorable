import { test, expect, BrowserContext, Page } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { PlayerSetupPage } from '../pages/player-setup.page'
import { GamePage } from '../pages/game.page'
import { clearStorage } from '../fixtures/storage-fixtures'

/**
 * Tests for multi-tab sync using Automerge.
 *
 * The app uses:
 * - BroadcastChannel for same-origin tab sync (immediate)
 * - WebSocket to sync.automerge.org for remote sync
 *
 * In these tests we use two pages (tabs) in the SAME browser context.
 * This allows BroadcastChannel to sync between them immediately.
 * Testing cross-browser sync (separate contexts) would require waiting for
 * the WebSocket server roundtrip, which is slow and flaky.
 */

test.describe('multi-tab sync', () => {
  let context: BrowserContext
  let page1: Page
  let page2: Page

  test.beforeEach(async ({ browser }) => {
    // Use single context with two pages (tabs) for BroadcastChannel sync
    context = await browser.newContext()
    page1 = await context.newPage()
    page2 = await context.newPage()

    // Clear storage once (shared by both pages in same context)
    await page1.goto('/')
    await clearStorage(page1)
    await page1.reload()

    await page2.goto('/')
  })

  test.afterEach(async () => {
    await context.close()
  })

  test('second browser can join game via URL', async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Player 1 creates a new game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, 'Alice')
    await setupPage1.addNewPlayer(1, 'Bob')
    await setupPage1.startGame()

    await gamePage1.expectOnGameScreen()

    // Get the game URL from the hash (hash contains doc ID without automerge: prefix)
    const gameUrl = await page1.evaluate(() => window.location.href)
    expect(gameUrl).toContain('#')

    // Player 2 navigates to the same URL
    await page2.goto(gameUrl)

    // Player 2 should see the game screen with both players
    await gamePage2.expectOnGameScreen()
    await gamePage2.expectPlayerName('Alice')
    await gamePage2.expectPlayerName('Bob')
  })

  test('moves sync between browsers', async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game in browser 1
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, 'Alice')
    await setupPage1.addNewPlayer(1, 'Bob')
    await setupPage1.startGame()

    // Browser 2 joins via URL
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Browser 1 (Alice) makes a move
    await gamePage1.placeWord(7, 7, 'CAT')
    await gamePage1.endTurn()

    // Verify score in browser 1
    expect(await gamePage1.getPlayerScore(0)).toBe(10)

    // Wait for sync and verify in browser 2
    await page2.waitForTimeout(500) // Allow sync time

    // Browser 2 should see the tiles
    await gamePage2.expectTileAt(7, 7, 'C')
    await gamePage2.expectTileAt(7, 8, 'A')
    await gamePage2.expectTileAt(7, 9, 'T')

    // Score should be synced
    expect(await gamePage2.getPlayerScore(0)).toBe(10)
  })

  test('turn changes sync between browsers', async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, 'Alice')
    await setupPage1.addNewPlayer(1, 'Bob')
    await setupPage1.startGame()

    // Browser 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Verify Alice is current player in both browsers
    expect(await gamePage1.getCurrentPlayerIndex()).toBe(0)
    expect(await gamePage2.getCurrentPlayerIndex()).toBe(0)

    // Alice makes a move
    await gamePage1.placeWord(7, 7, 'CAT')
    await gamePage1.endTurn()

    // Wait for sync
    await page2.waitForTimeout(500)

    // Now Bob should be current player in both browsers
    expect(await gamePage1.getCurrentPlayerIndex()).toBe(1)
    expect(await gamePage2.getCurrentPlayerIndex()).toBe(1)
  })

  test('both browsers can make moves', async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, 'Alice')
    await setupPage1.addNewPlayer(1, 'Bob')
    await setupPage1.startGame()

    // Browser 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Browser 1 (Alice) makes first move
    await gamePage1.placeWord(7, 7, 'CAT')
    await gamePage1.endTurn()

    // Wait for sync
    await page2.waitForTimeout(500)

    // Browser 2 (Bob) makes second move - extend CAT to CATS
    await gamePage2.clickCell(7, 10)
    await gamePage2.typeLetters('S')
    await gamePage2.endTurn()

    // Wait for sync back to browser 1
    await page1.waitForTimeout(500)

    // Verify both browsers see both tiles
    await gamePage1.expectTileAt(7, 7, 'C')
    await gamePage1.expectTileAt(7, 10, 'S')
    await gamePage2.expectTileAt(7, 7, 'C')
    await gamePage2.expectTileAt(7, 10, 'S')

    // Verify scores
    // Alice: CAT = 10 (C=3 + A=1 + T=1) * 2 (center)
    // Bob: CATS = 6 (C=3 + A=1 + T=1 + S=1), no multipliers on S
    expect(await gamePage1.getPlayerScore(0)).toBe(10)
    expect(await gamePage2.getPlayerScore(0)).toBe(10)
    expect(await gamePage1.getPlayerScore(1)).toBe(6)
    expect(await gamePage2.getPlayerScore(1)).toBe(6)
  })

  test('edited moves sync between tabs', async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, 'Alice')
    await setupPage1.addNewPlayer(1, 'Bob')
    await setupPage1.startGame()

    // Tab 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Alice makes a move
    await gamePage1.placeWord(7, 7, 'CAT')
    await gamePage1.endTurn()

    // Bob passes
    await gamePage1.endTurn()
    await gamePage1.confirmPass()

    // Wait for sync
    await page2.waitForTimeout(500)

    // Verify tab 2 sees CAT
    await gamePage2.expectTileAt(7, 7, 'C')
    await gamePage2.expectTileAt(7, 8, 'A')
    await gamePage2.expectTileAt(7, 9, 'T')

    // Tab 1 edits the move to add S (CATS)
    await gamePage1.longPressMove('Alice', 0)
    await gamePage1.expectInEditMode()
    await gamePage1.clickCell(7, 10) // Click after T
    await gamePage1.typeLetters('S')
    await gamePage1.saveEdit()

    // Wait for sync
    await page2.waitForTimeout(500)

    // Tab 2 should now see CATS
    await gamePage2.expectTileAt(7, 7, 'C')
    await gamePage2.expectTileAt(7, 8, 'A')
    await gamePage2.expectTileAt(7, 9, 'T')
    await gamePage2.expectTileAt(7, 10, 'S')
  })

  test('game persists after tab reloads', async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, 'Alice')
    await setupPage1.addNewPlayer(1, 'Bob')
    await setupPage1.startGame()

    // Tab 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Make a move
    await gamePage1.placeWord(7, 7, 'CAT')
    await gamePage1.endTurn()

    // Wait for sync and IndexedDB persistence
    await page1.waitForTimeout(500)

    // Reload both tabs
    await page1.reload()
    await page2.reload()

    // Wait for Automerge to reload from IndexedDB
    await page1.waitForTimeout(1000)

    // Both should see the game with the move (from IndexedDB)
    await gamePage1.expectOnGameScreen()
    await gamePage2.expectOnGameScreen()

    await gamePage1.expectTileAt(7, 7, 'C')
    await gamePage2.expectTileAt(7, 7, 'C')

    expect(await gamePage1.getPlayerScore(0)).toBe(10)
    expect(await gamePage2.getPlayerScore(0)).toBe(10)
  })
})
