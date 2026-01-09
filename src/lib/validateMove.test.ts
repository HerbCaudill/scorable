import { describe, expect, it } from "vitest"
import type { Move } from "./types"
import { createEmptyBoard } from "./types"
import { validateMove } from "./validateMove"

describe("validateMove", () => {
  describe("empty move (pass)", () => {
    it("accepts empty move on first turn", () => {
      const board = createEmptyBoard()
      const move: Move = []

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("accepts empty move on subsequent turn", () => {
      const board = createEmptyBoard()
      board[7][7] = "C"
      board[7][8] = "A"
      board[7][9] = "T"
      const move: Move = []

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })
  })

  describe("single line requirement", () => {
    it("accepts horizontal move", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 7, col: 8, tile: "A" },
        { row: 7, col: 9, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("accepts vertical move", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 8, col: 7, tile: "A" },
        { row: 9, col: 7, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("accepts single tile move", () => {
      const board = createEmptyBoard()
      const move: Move = [{ row: 7, col: 7, tile: "A" }]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("rejects diagonal move", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 8, col: 8, tile: "A" },
        { row: 9, col: 9, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: false, error: "Tiles must be in a single row or column" })
    })

    it("rejects L-shaped move", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 7, col: 8, tile: "A" },
        { row: 8, col: 8, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: false, error: "Tiles must be in a single row or column" })
    })

    it("rejects scattered tiles", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 5, col: 10, tile: "A" },
        { row: 9, col: 3, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: false, error: "Tiles must be in a single row or column" })
    })
  })

  describe("first move center square requirement", () => {
    it("accepts first move that includes center square", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 6, tile: "C" },
        { row: 7, col: 7, tile: "A" },
        { row: 7, col: 8, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("accepts first move with single tile on center", () => {
      const board = createEmptyBoard()
      const move: Move = [{ row: 7, col: 7, tile: "A" }]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("rejects first move that misses center square", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 0, col: 0, tile: "C" },
        { row: 0, col: 1, tile: "A" },
        { row: 0, col: 2, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: false, error: "First word must include the center square" })
    })

    it("rejects first move adjacent to but not on center", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 8, tile: "C" },
        { row: 7, col: 9, tile: "A" },
        { row: 7, col: 10, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: false, error: "First word must include the center square" })
    })

    it("does not require center for subsequent moves", () => {
      const board = createEmptyBoard()
      board[7][7] = "C"
      board[7][8] = "A"
      board[7][9] = "T"

      const move: Move = [{ row: 7, col: 10, tile: "S" }]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })
  })

  describe("connection to existing tiles requirement", () => {
    it("accepts move that connects horizontally to existing tile", () => {
      const board = createEmptyBoard()
      board[7][7] = "C"
      board[7][8] = "A"
      board[7][9] = "T"

      const move: Move = [{ row: 7, col: 10, tile: "S" }]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })

    it("accepts move that connects vertically to existing tile", () => {
      const board = createEmptyBoard()
      board[7][7] = "C"
      board[7][8] = "A"
      board[7][9] = "T"

      const move: Move = [
        { row: 8, col: 8, tile: "N" },
        { row: 9, col: 8, tile: "D" },
      ]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })

    it("accepts move that extends word from beginning", () => {
      const board = createEmptyBoard()
      board[7][7] = "A"
      board[7][8] = "T"

      const move: Move = [{ row: 7, col: 6, tile: "C" }]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })

    it("accepts move where one of multiple tiles connects", () => {
      const board = createEmptyBoard()
      board[7][7] = "C"
      board[7][8] = "A"
      board[7][9] = "T"

      // Vertical word "DOG" where D connects to A
      const move: Move = [
        { row: 6, col: 8, tile: "D" },
        { row: 5, col: 8, tile: "O" },
        { row: 4, col: 8, tile: "G" },
      ]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })

    it("rejects move that does not connect to any existing tile", () => {
      const board = createEmptyBoard()
      board[7][7] = "C"
      board[7][8] = "A"
      board[7][9] = "T"

      const move: Move = [
        { row: 0, col: 0, tile: "D" },
        { row: 0, col: 1, tile: "O" },
        { row: 0, col: 2, tile: "G" },
      ]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: false, error: "Word must connect to existing tiles" })
    })

    it("rejects move that is diagonally adjacent but not connected", () => {
      const board = createEmptyBoard()
      board[7][7] = "C"
      board[7][8] = "A"
      board[7][9] = "T"

      // Diagonal from T - not a valid connection
      const move: Move = [
        { row: 8, col: 10, tile: "D" },
        { row: 8, col: 11, tile: "O" },
        { row: 8, col: 12, tile: "G" },
      ]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: false, error: "Word must connect to existing tiles" })
    })
  })

  describe("no gaps requirement", () => {
    it("accepts horizontal word with no gaps", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 7, col: 8, tile: "A" },
        { row: 7, col: 9, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("accepts vertical word with no gaps", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 8, col: 7, tile: "A" },
        { row: 9, col: 7, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("accepts word with gap filled by existing tile", () => {
      const board = createEmptyBoard()
      board[7][8] = "A" // Existing tile in the middle

      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 7, col: 9, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("accepts vertical word with gap filled by existing tile", () => {
      const board = createEmptyBoard()
      board[8][7] = "A" // Existing tile in the middle

      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 9, col: 7, tile: "T" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("rejects horizontal word with empty gap", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 7, col: 9, tile: "T" }, // Gap at col 8
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: false, error: "Word cannot have gaps" })
    })

    it("rejects vertical word with empty gap", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 7, tile: "C" },
        { row: 9, col: 7, tile: "T" }, // Gap at row 8
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: false, error: "Word cannot have gaps" })
    })

    it("rejects word with multiple gaps", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 5, tile: "A" },
        { row: 7, col: 7, tile: "B" },
        { row: 7, col: 9, tile: "C" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: false, error: "Word cannot have gaps" })
    })
  })

  describe("edge cases", () => {
    it("handles move at board edge (top-left corner)", () => {
      const board = createEmptyBoard()
      board[7][7] = "X" // Existing tile to allow subsequent move

      // Place tiles connecting back to existing
      board[0][7] = "Y"
      const move: Move = [
        { row: 0, col: 0, tile: "C" },
        { row: 0, col: 1, tile: "A" },
        { row: 0, col: 2, tile: "T" },
      ]

      // This should fail because it doesn't connect
      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: false, error: "Word must connect to existing tiles" })
    })

    it("handles move at board edge (bottom-right corner)", () => {
      const board = createEmptyBoard()
      board[14][12] = "X" // Adjacent existing tile

      const move: Move = [
        { row: 14, col: 13, tile: "A" },
        { row: 14, col: 14, tile: "T" },
      ]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })

    it("handles tiles placed in non-sequential order", () => {
      const board = createEmptyBoard()
      // Tiles added in random order but form valid word
      const move: Move = [
        { row: 7, col: 9, tile: "T" },
        { row: 7, col: 7, tile: "C" },
        { row: 7, col: 8, tile: "A" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("handles very long word", () => {
      const board = createEmptyBoard()
      const move: Move = [
        { row: 7, col: 0, tile: "A" },
        { row: 7, col: 1, tile: "B" },
        { row: 7, col: 2, tile: "C" },
        { row: 7, col: 3, tile: "D" },
        { row: 7, col: 4, tile: "E" },
        { row: 7, col: 5, tile: "F" },
        { row: 7, col: 6, tile: "G" },
        { row: 7, col: 7, tile: "H" },
        { row: 7, col: 8, tile: "I" },
        { row: 7, col: 9, tile: "J" },
        { row: 7, col: 10, tile: "K" },
        { row: 7, col: 11, tile: "L" },
        { row: 7, col: 12, tile: "M" },
        { row: 7, col: 13, tile: "N" },
        { row: 7, col: 14, tile: "O" },
      ]

      const result = validateMove(move, board, true)
      expect(result).toEqual({ valid: true })
    })

    it("handles extending existing word in both directions", () => {
      const board = createEmptyBoard()
      board[7][7] = "A"
      board[7][8] = "T"

      // Add C before and S after: CAT -> CATS with C prepended
      const move: Move = [
        { row: 7, col: 6, tile: "C" },
        { row: 7, col: 9, tile: "S" },
      ]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })

    it("handles interleaving new tiles with existing tiles", () => {
      const board = createEmptyBoard()
      board[7][7] = "A"
      board[7][9] = "E"

      // Fill gaps to form word
      const move: Move = [
        { row: 7, col: 6, tile: "C" },
        { row: 7, col: 8, tile: "K" },
        { row: 7, col: 10, tile: "S" },
      ]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })
  })

  describe("combined validation scenarios", () => {
    it("validates all rules for a complex valid move", () => {
      const board = createEmptyBoard()
      board[7][7] = "C"
      board[7][8] = "A"
      board[7][9] = "T"

      // Valid perpendicular word connecting to existing
      const move: Move = [
        { row: 5, col: 8, tile: "M" },
        { row: 6, col: 8, tile: "A" },
        // Row 7, col 8 has 'A' already
        { row: 8, col: 8, tile: "Z" },
        { row: 9, col: 8, tile: "E" },
      ]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: true })
    })

    it("fails single line check before connection check", () => {
      const board = createEmptyBoard()
      board[7][7] = "C"
      board[7][8] = "A"
      board[7][9] = "T"

      // L-shaped move - should fail single line check first
      const move: Move = [
        { row: 7, col: 10, tile: "S" }, // Would connect
        { row: 8, col: 10, tile: "O" },
        { row: 8, col: 11, tile: "N" },
      ]

      const result = validateMove(move, board, false)
      expect(result).toEqual({ valid: false, error: "Tiles must be in a single row or column" })
    })

    it("fails center check before gap check for first move", () => {
      const board = createEmptyBoard()
      // Word with gap that also misses center
      const move: Move = [
        { row: 0, col: 0, tile: "C" },
        { row: 0, col: 2, tile: "T" }, // Gap at col 1
      ]

      const result = validateMove(move, board, true)
      // Should fail center check first
      expect(result).toEqual({ valid: false, error: "First word must include the center square" })
    })
  })
})
