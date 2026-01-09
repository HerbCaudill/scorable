import { describe, it, expect } from "vitest"
import { calculateEndGameAdjustments } from "./calculateEndGameAdjustments"

describe("calculateEndGameAdjustments", () => {
  describe("when a player ended the game", () => {
    it("deducts tile values from players with remaining tiles", () => {
      const result = calculateEndGameAdjustments(
        [
          { playerIndex: 0, tiles: ["Q", "Z"] }, // Q=10, Z=10 = 20
          { playerIndex: 1, tiles: [] }, // ended the game
        ],
        1, // player 1 ended the game
      )

      expect(result[0].deduction).toBe(-20)
      expect(result[1].deduction).toBe(-0) // empty rack = -0
    })

    it("gives bonus to player who ended the game equal to sum of other tiles", () => {
      const result = calculateEndGameAdjustments(
        [
          { playerIndex: 0, tiles: ["Q", "Z"] }, // 20 points
          { playerIndex: 1, tiles: [] }, // ended the game
        ],
        1,
      )

      expect(result[0].bonus).toBe(0)
      expect(result[1].bonus).toBe(20) // gets bonus for player 0's tiles
    })

    it("handles multiple players with remaining tiles", () => {
      const result = calculateEndGameAdjustments(
        [
          { playerIndex: 0, tiles: ["A", "E"] }, // 1 + 1 = 2
          { playerIndex: 1, tiles: [] }, // ended the game
          { playerIndex: 2, tiles: ["X", "Y"] }, // 8 + 4 = 12
        ],
        1,
      )

      expect(result[0].deduction).toBe(-2)
      expect(result[0].bonus).toBe(0)

      expect(result[1].deduction).toBe(-0) // empty rack
      expect(result[1].bonus).toBe(14) // 2 + 12

      expect(result[2].deduction).toBe(-12)
      expect(result[2].bonus).toBe(0)
    })

    it("handles blank tiles as 0 points", () => {
      const result = calculateEndGameAdjustments(
        [
          { playerIndex: 0, tiles: [" ", "A"] }, // 0 + 1 = 1
          { playerIndex: 1, tiles: [] },
        ],
        1,
      )

      expect(result[0].deduction).toBe(-1)
      expect(result[1].bonus).toBe(1)
    })
  })

  describe("when game is blocked (nobody ended the game)", () => {
    it("deducts tile values from all players with no bonus", () => {
      const result = calculateEndGameAdjustments(
        [
          { playerIndex: 0, tiles: ["Q"] }, // 10
          { playerIndex: 1, tiles: ["Z"] }, // 10
        ],
        null, // blocked game
      )

      expect(result[0].deduction).toBe(-10)
      expect(result[0].bonus).toBe(0)

      expect(result[1].deduction).toBe(-10)
      expect(result[1].bonus).toBe(0)
    })
  })

  describe("net calculation", () => {
    it("returns correct net value (deduction + bonus)", () => {
      const result = calculateEndGameAdjustments(
        [
          { playerIndex: 0, tiles: ["Q", "Z"] }, // -20
          { playerIndex: 1, tiles: [] }, // +20 bonus
        ],
        1,
      )

      expect(result[0].net).toBe(-20)
      expect(result[1].net).toBe(20)
    })
  })

  describe("edge cases", () => {
    it("handles empty racks for all players", () => {
      const result = calculateEndGameAdjustments(
        [
          { playerIndex: 0, tiles: [] },
          { playerIndex: 1, tiles: [] },
        ],
        0,
      )

      // All empty racks mean no adjustments (values are -0 which equals 0)
      expect(result[0].net).toBe(0)
      expect(result[1].net).toBe(0)
    })

    it("handles lowercase tile letters", () => {
      const result = calculateEndGameAdjustments(
        [
          { playerIndex: 0, tiles: ["q", "z"] }, // should still be 20
          { playerIndex: 1, tiles: [] },
        ],
        1,
      )

      expect(result[0].deduction).toBe(-20)
      expect(result[1].bonus).toBe(20)
    })
  })
})
