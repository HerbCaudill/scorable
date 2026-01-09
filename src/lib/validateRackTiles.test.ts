import { describe, it, expect } from "vitest"
import { validateRackTiles } from "./validateRackTiles"

describe("validateRackTiles", () => {
  const remainingTiles = {
    A: 2,
    E: 3,
    Q: 1,
    Z: 1,
    " ": 1, // blank
  }

  describe("valid racks", () => {
    it("returns valid when all tiles are available", () => {
      const result = validateRackTiles([["A", "E"], ["Q"]], remainingTiles)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("returns valid when using exact available count", () => {
      const result = validateRackTiles(
        [
          ["A", "A"],
          ["E", "E", "E"],
        ],
        remainingTiles,
      )

      expect(result.valid).toBe(true)
    })

    it("returns valid for empty racks", () => {
      const result = validateRackTiles([[], []], remainingTiles)

      expect(result.valid).toBe(true)
    })

    it("handles blank tiles", () => {
      const result = validateRackTiles([[" "]], remainingTiles)

      expect(result.valid).toBe(true)
    })
  })

  describe("invalid racks", () => {
    it("returns error when exceeding available tiles for one letter", () => {
      const result = validateRackTiles([["A", "A", "A"]], remainingTiles) // 3 A's but only 2 available

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        tile: "A",
        entered: 3,
        available: 2,
      })
    })

    it("counts tiles across all racks", () => {
      const result = validateRackTiles(
        [
          ["A", "A"], // 2 A's
          ["A"], // 1 more A = 3 total, but only 2 available
        ],
        remainingTiles,
      )

      expect(result.valid).toBe(false)
      expect(result.errors[0].tile).toBe("A")
      expect(result.errors[0].entered).toBe(3)
    })

    it("returns multiple errors for multiple violations", () => {
      const result = validateRackTiles(
        [
          ["A", "A", "A"], // 3 A's, only 2 available
          ["Q", "Q"], // 2 Q's, only 1 available
        ],
        remainingTiles,
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })

    it("returns error for tile not in remaining tiles", () => {
      const result = validateRackTiles([["X"]], remainingTiles) // X not in remaining

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toEqual({
        tile: "X",
        entered: 1,
        available: 0,
      })
    })
  })

  describe("case handling", () => {
    it("handles lowercase tiles", () => {
      const result = validateRackTiles([["a", "a", "a"]], remainingTiles)

      expect(result.valid).toBe(false)
      expect(result.errors[0].tile).toBe("A")
      expect(result.errors[0].entered).toBe(3)
    })
  })
})
