import { describe, expect, it } from "vitest"
import { parseGcg, type GcgGame, type GcgPlayMove } from "./parseGcg"

// Re-implement convertGcgToMoves to test - we can't easily import it since it's not exported
// and the actual function requires a Repo. Instead, we test the tile conversion logic directly.
function convertGcgToTiles(gcg: GcgGame): Array<{ row: number; col: number; tile: string }[]> {
  const board: (string | null)[][] = Array.from({ length: 15 }, () => Array(15).fill(null))
  const allTiles: Array<{ row: number; col: number; tile: string }[]> = []

  for (const move of gcg.moves) {
    if (move.type !== "play") continue

    const playMove = move as GcgPlayMove
    const tilesPlaced: Array<{ row: number; col: number; tile: string }> = []

    for (let j = 0; j < playMove.word.length; j++) {
      const row =
        playMove.position.direction === "vertical" ?
          playMove.position.row + j
        : playMove.position.row
      const col =
        playMove.position.direction === "horizontal" ?
          playMove.position.col + j
        : playMove.position.col

      // Only include new tiles
      if (board[row][col] === null) {
        const letter = playMove.word[j]
        // Lowercase letters represent blanks playing as that letter - keep them as-is
        // (the app uses lowercase to represent assigned blank tiles)
        tilesPlaced.push({ row, col, tile: letter })
        board[row][col] = letter.toUpperCase()
      }
    }

    if (tilesPlaced.length > 0) {
      allTiles.push(tilesPlaced)
    }
  }

  return allTiles
}

describe("GCG to game conversion", () => {
  it("preserves blank tile letters (lowercase) when converting GCG to game", () => {
    const gcg = `#player1 Alice Alice
#player2 Bob Bob
>Alice: DEJOSTU H4 JOUSTED +96 96
>Bob: ?AENOSV F3 nOVENAS +74 171`

    const result = parseGcg(gcg)
    const allTiles = convertGcgToTiles(result)

    // First move should be all uppercase (no blanks)
    const firstMoveTiles = allTiles[0]
    expect(firstMoveTiles.every(t => t.tile === t.tile.toUpperCase())).toBe(true)

    // Second move has a blank tile playing as 'N' (lowercase 'n')
    const secondMoveTiles = allTiles[1]
    // The first tile 'n' should be lowercase (blank playing as N)
    const blankTile = secondMoveTiles.find(t => t.tile === "n")
    expect(blankTile).toBeDefined()
    expect(blankTile?.tile).toBe("n") // Should be lowercase, not space

    // The remaining tiles should be uppercase (regular tiles)
    const regularTiles = secondMoveTiles.filter(t => t.tile !== "n")
    expect(regularTiles.every(t => t.tile === t.tile.toUpperCase())).toBe(true)
  })

  it("handles multiple blank tiles in a single word", () => {
    const gcg = `#player1 Alice Alice
#player2 Bob Bob
>Alice: ?? H8 cAt +10 10`

    const result = parseGcg(gcg)
    const allTiles = convertGcgToTiles(result)

    const tiles = allTiles[0]
    // 'c' and 't' should be lowercase (blanks)
    expect(tiles.find(t => t.tile === "c")).toBeDefined()
    expect(tiles.find(t => t.tile === "t")).toBeDefined()
    // 'A' should be uppercase (regular tile)
    expect(tiles.find(t => t.tile === "A")).toBeDefined()
  })

  it("handles blank at the end of a word (VROWs)", () => {
    const gcg = `#player1 Alice Alice
#player2 Bob Bob
>Alice: OWV? O11 VROWs +30 30`

    const result = parseGcg(gcg)
    const allTiles = convertGcgToTiles(result)

    const tiles = allTiles[0]
    // 's' should be lowercase (blank playing as S)
    const blankTile = tiles.find(t => t.tile === "s")
    expect(blankTile).toBeDefined()
    expect(blankTile?.tile).toBe("s")
  })

  it("handles blank in the middle of a word (SCAMsTER)", () => {
    const gcg = `#player1 Alice Alice
#player2 Bob Bob
>Alice: ACEMRT? 7H SCAMsTER +65 65`

    const result = parseGcg(gcg)
    const allTiles = convertGcgToTiles(result)

    const tiles = allTiles[0]
    // 's' should be lowercase (blank playing as S)
    const blankTile = tiles.find(t => t.tile === "s")
    expect(blankTile).toBeDefined()
    expect(blankTile?.tile).toBe("s")

    // Other letters should be uppercase
    const regularLetters = ["S", "C", "A", "M", "T", "E", "R"]
    for (const letter of regularLetters) {
      expect(tiles.find(t => t.tile === letter)).toBeDefined()
    }
  })
})
