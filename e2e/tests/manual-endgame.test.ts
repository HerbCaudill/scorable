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

  test("replay game and pause before last move", async ({ page }) => {
    // Replay all but the last move from the GCG file
    // The near-end-game.gcg has 24 play moves
    const { gamePage } = await replayGcgGame(page, "near-end-game.gcg", {
      stopAfterMoves: 23, // Stop one move before the end
    })

    await gamePage.expectOnGameScreen()

    // Pause here - Playwright Inspector opens and you can interact manually
    // Click "Resume" in the inspector when done, or close the browser
    await page.pause()
  })
})
