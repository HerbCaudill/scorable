import { test } from "@playwright/test"
import { replayGcgGame } from "../fixtures/replay-game"

/**
 * Manual testing helper for end-game scenarios.
 *
 * Run with: pnpm test:pw --headed e2e/tests/manual-endgame.test.ts
 *
 * The test replays a game from a GCG file up to (total moves - 1),
 * then pauses so you can manually interact with the UI.
 */
test.describe("Manual end game testing", () => {
  // Increase timeout since replaying a full game takes time
  test.setTimeout(120_000)

  test("replay game and pause after last move", async ({ page }) => {
    // Replay the complete game from the GCG file
    const { gamePage } = await replayGcgGame(page, "near-end-game.gcg")

    await gamePage.expectOnGameScreen()

    // Pause here - Playwright Inspector opens and you can interact manually
    // Click "Resume" in the inspector when done, or close the browser
    await page.pause()
  })
})
