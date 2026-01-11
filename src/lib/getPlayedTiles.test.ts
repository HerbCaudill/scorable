import { describe, test, expect } from "vitest"
import { getPlayedTiles } from "./getPlayedTiles"
import { createEmptyBoard } from "./types"
import type { Game } from "./types"

const createTestGame = (
  moves: Array<{ tiles: string[]; positions: Array<{ row: number; col: number }> }>,
): Game => {
  const board = createEmptyBoard()
  const gameMoves = moves.map((move, index) => {
    const tilesPlaced = move.tiles.map((tile, i) => ({
      row: move.positions[i].row,
      col: move.positions[i].col,
      tile,
    }))
    return { playerIndex: index % 2, tilesPlaced }
  })

  return {
    players: [
      { name: "Player 1", timeRemainingMs: 1800000, color: "#3B82F6" },
      { name: "Player 2", timeRemainingMs: 1800000, color: "#EF4444" },
    ],
    currentPlayerIndex: moves.length % 2,
    board,
    moves: gameMoves,
    timerEvents: [],
    status: "playing",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

describe("getPlayedTiles", () => {
  test("counts regular tiles correctly", () => {
    const game = createTestGame([
      {
        tiles: ["C", "A", "T"],
        positions: [
          { row: 7, col: 7 },
          { row: 7, col: 8 },
          { row: 7, col: 9 },
        ],
      },
    ])

    const played = getPlayedTiles(game)

    expect(played).toEqual({ C: 1, A: 1, T: 1 })
  })

  test("counts blank tiles (lowercase) separately from regular tiles", () => {
    // 's' is a blank tile representing S
    const game = createTestGame([
      {
        tiles: ["C", "A", "s"], // lowercase 's' = blank
        positions: [
          { row: 7, col: 7 },
          { row: 7, col: 8 },
          { row: 7, col: 9 },
        ],
      },
    ])

    const played = getPlayedTiles(game)

    // Blank should be counted as " " not as "S"
    expect(played).toEqual({ C: 1, A: 1, " ": 1 })
    expect(played["S"]).toBeUndefined()
  })

  test("counts space as blank tile", () => {
    const game = createTestGame([
      {
        tiles: [" ", "A", "T"],
        positions: [
          { row: 7, col: 7 },
          { row: 7, col: 8 },
          { row: 7, col: 9 },
        ],
      },
    ])

    const played = getPlayedTiles(game)

    expect(played).toEqual({ " ": 1, A: 1, T: 1 })
  })

  test("counts multiple blanks correctly", () => {
    const game = createTestGame([
      {
        tiles: ["s", "A", "t"], // two blanks: s and t
        positions: [
          { row: 7, col: 7 },
          { row: 7, col: 8 },
          { row: 7, col: 9 },
        ],
      },
    ])

    const played = getPlayedTiles(game)

    expect(played).toEqual({ " ": 2, A: 1 })
  })

  test("counts regular S separately from blank-as-S", () => {
    const game = createTestGame([
      {
        tiles: ["S", "A", "T"], // regular S
        positions: [
          { row: 7, col: 7 },
          { row: 7, col: 8 },
          { row: 7, col: 9 },
        ],
      },
      {
        tiles: ["s", "O", "B"], // blank as S
        positions: [
          { row: 8, col: 7 },
          { row: 8, col: 8 },
          { row: 8, col: 9 },
        ],
      },
    ])

    const played = getPlayedTiles(game)

    expect(played["S"]).toBe(1) // regular S
    expect(played[" "]).toBe(1) // blank
  })
})
