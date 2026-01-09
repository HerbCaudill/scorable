import { test, expect } from '@playwright/test'
import { GamePage } from '../pages/game.page'
import { loadGcgGame } from '../fixtures/gcg-fixtures'
import { seedGameFromGcg } from '../fixtures/seed-game'
import type { GcgGame } from '../../src/lib/parseGcg'

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
    if (move.type === 'play' && nextMove.type === 'challenge' && move.player === nextMove.player) {
      challengedOffIndices.add(i)
    }
  }

  let player1Score = 0
  let player2Score = 0

  for (let i = 0; i < gcg.moves.length; i++) {
    const move = gcg.moves[i]
    if (move.type !== 'play' || challengedOffIndices.has(i)) continue

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
  'cresta-yorra-2006.gcg',
  'anno57595.gcg',
  'anno57629.gcg',
  'anno57680.gcg',
  'anno57691.gcg',
  'anno57697.gcg',
  'anno57701.gcg',
  'anno57721.gcg',
  'anno57741.gcg',
]

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
