import { test, expect } from "@playwright/test"
import { HomePage } from "../pages/home.page"
import { PlayerSetupPage } from "../pages/player-setup.page"
import { GamePage } from "../pages/game.page"
import {
  loadGcgGame,
  getNewTiles,
  applyMoveToBoard,
  getPlayerNames,
} from "../fixtures/gcg-fixtures"
import { seedGameFromGcg } from "../fixtures/seed-game"
import type { GcgGame, GcgPlayMove } from "../../src/lib/parseGcg"
import type { BoardState } from "../../src/lib/types"

/**
 * Calculate expected scores from a GCG game.
 * Uses individual move scores (not cumulative) because the app doesn't
 * implement challenge bonuses.
 */
function calculateExpectedScores(gcg: GcgGame): { player1: number; player2: number } {
  // Build set of move indices that were challenged off
  const challengedOffIndices = new Set<number>()
  for (let i = 0; i < gcg.moves.length - 1; i++) {
    const move = gcg.moves[i]
    const nextMove = gcg.moves[i + 1]
    if (move.type === "play" && nextMove.type === "challenge" && move.player === nextMove.player) {
      challengedOffIndices.add(i)
    }
  }

  let player1Score = 0
  let player2Score = 0

  for (let i = 0; i < gcg.moves.length; i++) {
    const move = gcg.moves[i]
    if (move.type !== "play" || challengedOffIndices.has(i)) continue

    if (move.player === gcg.player1.nickname) {
      player1Score += move.score
    } else {
      player2Score += move.score
    }
  }

  return { player1: player1Score, player2: player2Score }
}

// List of GCG files to test
const gcgFiles = [
  "cresta-yorra-2006.gcg",
  "anno57595.gcg",
  "anno57629.gcg",
  "anno57680.gcg",
  "anno57691.gcg",
  "anno57697.gcg",
  "anno57701.gcg",
  "anno57721.gcg",
  "anno57741.gcg",
]

test.describe("Score Verification", () => {
  for (const gcgFile of gcgFiles) {
    test(`verifies final scores for ${gcgFile}`, async ({ page }) => {
      const gcg = loadGcgGame(gcgFile)
      const expectedScores = calculateExpectedScores(gcg)

      // Seed the entire game at once (much faster than UI replay)
      await seedGameFromGcg(page, gcg)

      const gamePage = new GamePage(page)

      // Verify final scores match expected
      const player1Score = await gamePage.getPlayerScore(0)
      const player2Score = await gamePage.getPlayerScore(1)

      expect(player1Score, `${gcg.player1.name} score`).toBe(expectedScores.player1)
      expect(player2Score, `${gcg.player2.name} score`).toBe(expectedScores.player2)
    })
  }

  const createEmptyBoard = (): BoardState =>
    Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))

  /**
   * Single UI-based test that plays through moves one at a time.
   * This verifies that the scoring logic works correctly when tiles are
   * placed through the UI, not just seeded directly.
   */
  test("verifies running scores via UI for cresta-yorra-2006.gcg", async ({ page }) => {
    test.setTimeout(180000) // 3 minutes

    const gcg = loadGcgGame("cresta-yorra-2006.gcg")
    const [player1, player2] = getPlayerNames(gcg)

    // Build set of move indices that were challenged off
    const challengedOffIndices = new Set<number>()
    for (let i = 0; i < gcg.moves.length - 1; i++) {
      const move = gcg.moves[i]
      const nextMove = gcg.moves[i + 1]
      if (
        move.type === "play" &&
        nextMove.type === "challenge" &&
        move.player === nextMove.player
      ) {
        challengedOffIndices.add(i)
      }
    }

    // Start new game through UI
    const homePage = new HomePage(page)
    await homePage.goto()
    await homePage.clickNewGame()

    const playerSetup = new PlayerSetupPage(page)
    await playerSetup.addNewPlayer(0, player1)
    await playerSetup.addNewPlayer(1, player2)
    await playerSetup.startGame()

    const gamePage = new GamePage(page)
    await gamePage.expectOnGameScreen()

    // Track board state and expected scores
    let board = createEmptyBoard()
    const expectedScores: Record<string, number> = {
      [gcg.player1.nickname]: 0,
      [gcg.player2.nickname]: 0,
    }

    for (let moveIndex = 0; moveIndex < gcg.moves.length; moveIndex++) {
      const move = gcg.moves[moveIndex]

      if (move.type === "end") continue
      if (challengedOffIndices.has(moveIndex)) continue

      if (move.type === "play") {
        const playMove = move as GcgPlayMove
        const newTiles = getNewTiles(playMove, board)

        if (newTiles.length > 0) {
          const direction = playMove.position.direction

          for (let i = 0; i < newTiles.length; i++) {
            const tile = newTiles[i]
            await gamePage.clickCell(tile.row, tile.col)
            if (i === 0 && direction === "vertical") {
              await gamePage.clickCell(tile.row, tile.col)
            }
            if (tile.tile === " ") {
              await gamePage.pressKey(" ")
            } else {
              await gamePage.typeLetters(tile.tile)
            }
          }

          await gamePage.endTurn()
          board = applyMoveToBoard(playMove, board)
        }

        expectedScores[move.player] += move.score
      } else if (move.type === "exchange" || move.type === "challenge") {
        await gamePage.endTurn()
        await page.waitForSelector('[role="alertdialog"]')
        await gamePage.confirmPass()
        await page.waitForSelector('[role="alertdialog"]', { state: "detached" })
      }

      // Verify scores after each move
      const player1Score = await gamePage.getPlayerScore(0)
      const player2Score = await gamePage.getPlayerScore(1)

      expect(player1Score, `Move ${moveIndex}: ${gcg.player1.name}`).toBe(
        expectedScores[gcg.player1.nickname],
      )
      expect(player2Score, `Move ${moveIndex}: ${gcg.player2.name}`).toBe(
        expectedScores[gcg.player2.nickname],
      )
    }
  })
})
