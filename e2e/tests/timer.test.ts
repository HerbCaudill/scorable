import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"

import { seedTwoPlayerGame } from "../fixtures/seed-game"

test.describe("Timer", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await seedTwoPlayerGame(page)
    gamePage = new GamePage(page)
  })

  test("timers are hidden until first started", async ({ page }) => {
    // Timer elements should not be visible initially
    const aliceTimer = gamePage.getPlayerTimer(0)
    const bobTimer = gamePage.getPlayerTimer(1)
    await expect(aliceTimer).not.toBeVisible()
    await expect(bobTimer).not.toBeVisible()

    // Start timer
    await gamePage.toggleTimer()

    // Now timers should be visible
    await expect(aliceTimer).toBeVisible()
    await expect(bobTimer).toBeVisible()
  })

  test("timers stay visible after pausing", async ({ page }) => {
    // Start timer
    await gamePage.toggleTimer()

    // Pause timer
    await gamePage.toggleTimer()

    // Timers should still be visible
    const aliceTimer = gamePage.getPlayerTimer(0)
    const bobTimer = gamePage.getPlayerTimer(1)
    await expect(aliceTimer).toBeVisible()
    await expect(bobTimer).toBeVisible()
  })

  test("timer starts when Start Timer clicked", async ({ page }) => {
    // Initially should show "Timer" button (timer never used)
    await expect(page.getByRole("button", { name: "Timer" })).toBeVisible()

    // Start timer
    await gamePage.toggleTimer()

    // Should now show "Pause" button
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible()
  })

  test("timer pauses when Pause Timer clicked", async ({ page }) => {
    // Start timer
    await gamePage.toggleTimer()
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible()

    // Pause timer
    await gamePage.toggleTimer()

    // Should show "Resume" button
    await expect(page.getByRole("button", { name: "Resume" })).toBeVisible()
  })

  test("timer countdown decrements over time", async ({ page }) => {
    // Start timer first (timers are hidden until started)
    await gamePage.toggleTimer()

    // Get initial time display from the timer element
    const timer = gamePage.getPlayerTimer(0)

    // Wait for timer to decrement from initial 30:00
    await expect(timer).not.toHaveAttribute("aria-label", "30:00 remaining")
  })

  test("timer pauses during moves", async ({ page }) => {
    // Start timer
    await gamePage.toggleTimer()

    // Wait for timer to decrement
    const timer = gamePage.getPlayerTimer(0)
    await expect(timer).not.toHaveAttribute("aria-label", "30:00 remaining")

    // Pause timer
    await gamePage.toggleTimer()

    // Get time immediately after pause
    const labelAfterPause = await timer.getAttribute("aria-label")

    // Verify timer stays the same - poll a few times to ensure it's stable
    await expect
      .poll(
        async () => {
          return timer.getAttribute("aria-label")
        },
        { intervals: [200, 200, 200], timeout: 1000 },
      )
      .toBe(labelAfterPause)
  })

  test("timer continues for next player after turn", async ({ page }) => {
    // Start timer
    await gamePage.toggleTimer()
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible()

    // Make a move
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Timer should still be running (now for Bob)
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible()
  })

  test("each player has independent timer", async ({ page }) => {
    // Start timer first (timers are hidden until started)
    await gamePage.toggleTimer()

    // Get both timers
    const aliceTimer = gamePage.getPlayerTimer(0)
    const bobTimer = gamePage.getPlayerTimer(1)
    const bobInitialLabel = await bobTimer.getAttribute("aria-label")

    // Wait for Alice's timer to decrease (Alice's turn)
    await expect(aliceTimer).not.toHaveAttribute("aria-label", "30:00 remaining")

    // Bob's time should still be the same
    const bobLabelAfter = await bobTimer.getAttribute("aria-label")
    expect(bobLabelAfter).toBe(bobInitialLabel)
  })

  test("board is editable while timer is running", async ({ page }) => {
    // Start timer
    await gamePage.toggleTimer()
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible()

    // Wait for timer to actually start running
    const timer = gamePage.getPlayerTimer(0)
    await expect(timer).not.toHaveAttribute("aria-label", "30:00 remaining")

    // Try to place a word on the board - typing multiple letters tests that
    // the timer interval doesn't steal focus away from the board
    await gamePage.clickCell(7, 7)
    await gamePage.expectCellSelected(7, 7)

    // Type a word - the timer running should not interfere
    await gamePage.typeLetters("CAT")

    // All tiles should be placed
    await gamePage.expectTileAt(7, 7, "C")
    await gamePage.expectTileAt(7, 8, "A")
    await gamePage.expectTileAt(7, 9, "T")
  })
})
