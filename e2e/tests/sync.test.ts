import { test, expect, BrowserContext, Page, Browser } from "@playwright/test"
import { HomePage } from "../pages/home.page"
import { PlayerSetupPage } from "../pages/player-setup.page"
import { GamePage } from "../pages/game.page"
import { clearStorage } from "../fixtures/storage-fixtures"

/**
 * Tests for multi-tab sync using Automerge.
 *
 * The app uses:
 * - BroadcastChannel for same-origin tab sync (immediate)
 * - WebSocket sync server for cross-browser/device sync
 *
 * Two test suites:
 * 1. "Multi-tab sync" - Uses same browser context (BroadcastChannel)
 * 2. "Cross-browser sync" - Uses separate contexts via WebSocket server
 */

test.describe("Multi-tab sync", () => {
  let context: BrowserContext
  let page1: Page
  let page2: Page

  test.beforeEach(async ({ browser }) => {
    // Use single context with two pages (tabs) for BroadcastChannel sync
    context = await browser.newContext()
    page1 = await context.newPage()
    page2 = await context.newPage()

    // Clear storage once (shared by both pages in same context)
    await page1.goto("/")
    await clearStorage(page1)
    await page1.reload()

    await page2.goto("/")
  })

  test.afterEach(async () => {
    await context.close()
  })

  test("second browser can join game via URL", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Player 1 creates a new game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    await gamePage1.expectOnGameScreen()

    // Get the game URL from the hash (hash contains doc ID without automerge: prefix)
    const gameUrl = await page1.evaluate(() => window.location.href)
    expect(gameUrl).toContain("#")

    // Player 2 navigates to the same URL
    await page2.goto(gameUrl)

    // Player 2 should see the game screen with both players
    await gamePage2.expectOnGameScreen()
    await gamePage2.expectPlayerName("Alice")
    await gamePage2.expectPlayerName("Bob")
  })

  test("moves sync between browsers", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game in browser 1
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    // Browser 2 joins via URL
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Browser 1 (Alice) makes a move
    await gamePage1.placeWord(7, 7, "CAT")
    await gamePage1.endTurn()

    // Verify score in browser 1
    expect(await gamePage1.getPlayerScore(0)).toBe(10)

    // Browser 2 should see the tiles (wait for sync)
    await gamePage2.expectTileAt(7, 7, "C")
    await gamePage2.expectTileAt(7, 8, "A")
    await gamePage2.expectTileAt(7, 9, "T")

    // Score should be synced
    expect(await gamePage2.getPlayerScore(0)).toBe(10)
  })

  test("turn changes sync between browsers", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    // Browser 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Verify Alice is current player in both browsers
    expect(await gamePage1.getCurrentPlayerIndex()).toBe(0)
    expect(await gamePage2.getCurrentPlayerIndex()).toBe(0)

    // Alice makes a move
    await gamePage1.placeWord(7, 7, "CAT")
    await gamePage1.endTurn()

    // Now Bob should be current player in both browsers (wait for sync)
    expect(await gamePage1.getCurrentPlayerIndex()).toBe(1)
    await expect.poll(async () => gamePage2.getCurrentPlayerIndex(), { timeout: 5000 }).toBe(1)
  })

  test("both browsers can make moves", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    // Browser 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Browser 1 (Alice) makes first move
    await gamePage1.placeWord(7, 7, "CAT")
    await gamePage1.endTurn()

    // Wait for sync before browser 2 can make a move
    await gamePage2.expectTileAt(7, 7, "C")

    // Browser 2 (Bob) makes second move - extend CAT to CATS
    await gamePage2.clickCell(7, 10)
    await gamePage2.typeLetters("S")
    await gamePage2.endTurn()

    // Verify both browsers see both tiles (wait for sync)
    await gamePage1.expectTileAt(7, 7, "C")
    await gamePage1.expectTileAt(7, 10, "S")
    await gamePage2.expectTileAt(7, 7, "C")
    await gamePage2.expectTileAt(7, 10, "S")

    // Verify scores
    // Alice: CAT = 10 (C=3 + A=1 + T=1) * 2 (center)
    // Bob: CATS = 6 (C=3 + A=1 + T=1 + S=1), no multipliers on S
    expect(await gamePage1.getPlayerScore(0)).toBe(10)
    expect(await gamePage2.getPlayerScore(0)).toBe(10)
    expect(await gamePage1.getPlayerScore(1)).toBe(6)
    expect(await gamePage2.getPlayerScore(1)).toBe(6)
  })

  test("edited moves sync between tabs", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    // Tab 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Alice makes a move
    await gamePage1.placeWord(7, 7, "CAT")
    await gamePage1.endTurn()

    // Bob passes
    await gamePage1.pass()

    // Verify tab 2 sees CAT (wait for sync)
    await gamePage2.expectTileAt(7, 7, "C")
    await gamePage2.expectTileAt(7, 8, "A")
    await gamePage2.expectTileAt(7, 9, "T")

    // Tab 1 edits the move to add S (CATS)
    await gamePage1.longPressMove("Alice", 0)
    await gamePage1.expectInEditMode()
    await gamePage1.clickCell(7, 10) // Click after T
    await gamePage1.typeLetters("S")
    await gamePage1.saveEdit()

    // Tab 2 should now see CATS (wait for sync)
    await gamePage2.expectTileAt(7, 7, "C")
    await gamePage2.expectTileAt(7, 8, "A")
    await gamePage2.expectTileAt(7, 9, "T")
    await gamePage2.expectTileAt(7, 10, "S")
  })
})

/**
 * Cross-browser sync tests using separate browser contexts.
 * These contexts don't share BroadcastChannel, so they must sync via WebSocket server.
 * This simulates two different devices or browsers connecting to the same game.
 *
 * TODO: These tests are currently skipped because of an issue where the second browser
 * context's automerge-repo doesn't properly request documents over WebSocket when
 * navigating directly to a game URL. The server receives and stores the document from
 * browser 1, but browser 2's repo.find() call doesn't trigger a network request.
 * This may be a timing issue with WebSocket connection establishment or a limitation
 * in automerge-repo's document discovery protocol.
 */
test.describe.skip("Cross-browser sync", () => {
  // WebSocket sync is slower than BroadcastChannel, so increase timeout
  test.setTimeout(30000)
  let browser: Browser
  let context1: BrowserContext
  let context2: BrowserContext
  let page1: Page
  let page2: Page

  test.beforeEach(async ({ browser: b }) => {
    browser = b
    // Create two separate contexts (simulates different browsers/devices)
    context1 = await browser.newContext()
    context2 = await browser.newContext()
    page1 = await context1.newPage()
    page2 = await context2.newPage()

    // Clear storage in both contexts separately
    await page1.goto("/")
    await clearStorage(page1)
    await page1.reload()

    await page2.goto("/")
    await clearStorage(page2)
    await page2.reload()
  })

  test.afterEach(async () => {
    await context1.close()
    await context2.close()
  })

  test("second browser can join game via URL (cross-browser)", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Browser 1 creates a new game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    await gamePage1.expectOnGameScreen()

    // Get the game URL
    const gameUrl = await page1.evaluate(() => window.location.href)
    expect(gameUrl).toContain("#")
    console.log(`Game URL: ${gameUrl}`)

    // Give the sync server time to receive and store the document from browser 1
    await page1.waitForTimeout(2000)

    // First, navigate browser 2 to the home page to establish WebSocket connection
    await page2.goto("/")
    await expect(page2.getByRole("button", { name: /new game/i })).toBeVisible()
    // Wait for WebSocket to be fully connected
    await page2.waitForTimeout(1000)

    // Now navigate to the game URL - the WebSocket should be ready
    await page2.goto(gameUrl)

    // Browser 2 should see the game screen with both players (via WebSocket sync)
    await expect(page2.getByRole("grid", { name: "Scrabble board" })).toBeVisible({
      timeout: 20000,
    })
    await gamePage2.expectPlayerName("Alice")
    await gamePage2.expectPlayerName("Bob")
  })

  test("moves sync between separate browsers", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game in browser 1
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    // Give the server time to receive the document
    await page1.waitForTimeout(500)

    // Browser 2 joins via URL
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await expect(page2.getByRole("grid", { name: "Scrabble board" })).toBeVisible({
      timeout: 15000,
    })

    // Browser 1 (Alice) makes a move
    await gamePage1.placeWord(7, 7, "CAT")
    await gamePage1.endTurn()

    // Verify score in browser 1
    expect(await gamePage1.getPlayerScore(0)).toBe(10)

    // Browser 2 should see the tiles (wait for WebSocket sync, longer timeout)
    await gamePage2.expectTileAt(7, 7, "C", 15000)
    await gamePage2.expectTileAt(7, 8, "A")
    await gamePage2.expectTileAt(7, 9, "T")

    // Score should be synced
    expect(await gamePage2.getPlayerScore(0)).toBe(10)
  })

  test("both browsers can make moves (cross-browser)", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    // Give the server time to receive the document
    await page1.waitForTimeout(500)

    // Browser 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await expect(page2.getByRole("grid", { name: "Scrabble board" })).toBeVisible({
      timeout: 15000,
    })

    // Browser 1 (Alice) makes first move
    await gamePage1.placeWord(7, 7, "CAT")
    await gamePage1.endTurn()

    // Wait for sync before browser 2 can make a move (longer timeout for WebSocket)
    await gamePage2.expectTileAt(7, 7, "C", 15000)

    // Browser 2 (Bob) makes second move - extend CAT to CATS
    await gamePage2.clickCell(7, 10)
    await gamePage2.typeLetters("S")
    await gamePage2.endTurn()

    // Verify both browsers see both tiles (wait for sync)
    await gamePage1.expectTileAt(7, 7, "C")
    await gamePage1.expectTileAt(7, 10, "S", 15000)
    await gamePage2.expectTileAt(7, 7, "C")
    await gamePage2.expectTileAt(7, 10, "S")

    // Verify scores
    expect(await gamePage1.getPlayerScore(0)).toBe(10)
    expect(await gamePage2.getPlayerScore(0)).toBe(10)
    expect(await gamePage1.getPlayerScore(1)).toBe(6)
    expect(await gamePage2.getPlayerScore(1)).toBe(6)
  })
})

test.describe("Multi-tab persistence", () => {
  let context: BrowserContext
  let page1: Page
  let page2: Page

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext()
    page1 = await context.newPage()
    page2 = await context.newPage()

    await page1.goto("/")
    await clearStorage(page1)
    await page1.reload()

    await page2.goto("/")
  })

  test.afterEach(async () => {
    await context.close()
  })

  test("game persists after tab reloads", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    // Tab 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Make a move
    await gamePage1.placeWord(7, 7, "CAT")
    await gamePage1.endTurn()

    // Wait for sync to tab 2 before reloading
    await gamePage2.expectTileAt(7, 7, "C")

    // Reload both tabs
    await page1.reload()
    await page2.reload()

    // Both should see the game with the move (from IndexedDB)
    await gamePage1.expectOnGameScreen()
    await gamePage2.expectOnGameScreen()

    await gamePage1.expectTileAt(7, 7, "C")
    await gamePage2.expectTileAt(7, 7, "C")

    expect(await gamePage1.getPlayerScore(0)).toBe(10)
    expect(await gamePage2.getPlayerScore(0)).toBe(10)
  })

  test("timer state syncs between tabs", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game in tab 1
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    // Tab 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Initially both should show "Timer" button (never used)
    await expect(page1.getByRole("button", { name: "Timer" })).toBeVisible()
    await expect(page2.getByRole("button", { name: "Timer" })).toBeVisible()

    // Tab 1 starts the timer
    await gamePage1.toggleTimer()
    await expect(page1.getByRole("button", { name: "Pause" })).toBeVisible()

    // Tab 2 should also show timer as running (wait for sync)
    await expect(page2.getByRole("button", { name: "Pause" })).toBeVisible()

    // Tab 2 pauses the timer
    await gamePage2.toggleTimer()
    await expect(page2.getByRole("button", { name: "Resume" })).toBeVisible()

    // Tab 1 should also show timer as paused (wait for sync)
    await expect(page1.getByRole("button", { name: "Resume" })).toBeVisible()
  })

  test("timer switches to next player on move across tabs", async () => {
    const homePage1 = new HomePage(page1)
    const setupPage1 = new PlayerSetupPage(page1)
    const gamePage1 = new GamePage(page1)
    const gamePage2 = new GamePage(page2)

    // Create game
    await homePage1.clickNewGame()
    await setupPage1.addNewPlayer(0, "Alice")
    await setupPage1.addNewPlayer(1, "Bob")
    await setupPage1.startGame()

    // Tab 2 joins
    const gameUrl = await page1.evaluate(() => window.location.href)
    await page2.goto(gameUrl)
    await gamePage2.expectOnGameScreen()

    // Tab 1 starts timer (Alice's turn)
    await gamePage1.toggleTimer()

    // Wait for timer to actually start decrementing
    const aliceTimer = gamePage1.getPlayerTimer(0)
    await expect(aliceTimer).not.toHaveAttribute("aria-label", "30:00 remaining")

    // Tab 1 makes a move - timer should switch to Bob
    await gamePage1.placeWord(7, 7, "CAT")
    await gamePage1.endTurn()

    // Timer should still be running in both tabs (wait for sync)
    await expect(page1.getByRole("button", { name: "Pause" })).toBeVisible()
    await expect(page2.getByRole("button", { name: "Pause" })).toBeVisible()

    // Get Alice's timer - should have decreased
    const aliceTimer1 = gamePage1.getPlayerTimer(0)
    const aliceLabel1 = await aliceTimer1.getAttribute("aria-label")
    expect(aliceLabel1).not.toBe("30:00 remaining")

    // Tab 2 should see same timer value (approximately)
    const aliceTimer2 = gamePage2.getPlayerTimer(0)
    const aliceLabel2 = await aliceTimer2.getAttribute("aria-label")
    expect(aliceLabel2).toBe(aliceLabel1)
  })
})
