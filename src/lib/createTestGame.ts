import type { Repo } from "@automerge/automerge-repo"
import type { DocumentId } from "@automerge/automerge-repo"
import { parseGcg, type GcgGame, type GcgPlayMove } from "./parseGcg"
import { createEmptyBoardDoc, type GameDoc, type GameMoveDoc } from "./automergeTypes"
import { PLAYER_COLORS, DEFAULT_TIME_MS } from "./types"

// Sample GCG game data (from anno57595.gcg, a real game with interesting moves)
const SAMPLE_GCG = `#character-encoding UTF-8
#description Created with Macondo
#player1 Alice Alice
#player2 Bob Bob
>Alice: CHANERS H5 CHA.NERS +64 64
>Bob: RIMGANI 8G RIM +10 74
>Alice: CUP F8 CUP +22 86
>Bob: GEARING J7 GEARING +67 153
>Alice: EIOSTUR L5 STOURIE +71 157
>Bob: HEFIJAM 5H .HEF +24 177
>Alice: GED D8 GED +18 175
>Bob: MAOIAJE E9 MOAI +20 197
>Alice: BY D12 BY +22 197
>Bob: DOFAJEE C11 DOF +35 232
>Alice: IVOT 5B .IVOT +20 217
>Bob: AJEEAQL M11 AJEE +24 256
>Alice: POUTINE B5 POUTINE +66 283
>Bob: AXIWELQ A8 AX +42 298
>Alice: ELLNQWI N9 QIN +17 300`

/**
 * Convert a GCG game to game moves.
 */
const convertGcgToMoves = (gcg: GcgGame): GameMoveDoc[] => {
  // Build set of move indices that were challenged off
  const challengedOffIndices = new Set<number>()
  for (let i = 0; i < gcg.moves.length - 1; i++) {
    const move = gcg.moves[i]
    const nextMove = gcg.moves[i + 1]
    if (move.type === "play" && nextMove.type === "challenge" && move.player === nextMove.player) {
      challengedOffIndices.add(i)
    }
  }

  // Track board state to determine new tiles
  const board: (string | null)[][] = Array.from({ length: 15 }, () => Array(15).fill(null))

  const moves: GameMoveDoc[] = []

  for (let i = 0; i < gcg.moves.length; i++) {
    const move = gcg.moves[i]

    // Skip non-play moves and challenged-off plays
    if (move.type !== "play" || challengedOffIndices.has(i)) continue

    const playMove = move as GcgPlayMove
    const playerIndex = move.player === gcg.player1.nickname ? 0 : 1

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
        // Lowercase = blank tile, represent as space
        const tile = letter === letter.toLowerCase() ? " " : letter
        tilesPlaced.push({ row, col, tile })
        board[row][col] = letter.toUpperCase()
      }
    }

    if (tilesPlaced.length > 0) {
      moves.push({ playerIndex, tilesPlaced })
    }
  }

  return moves
}

/**
 * Create a test game with Alice vs Bob using a sample GCG game.
 * Returns the document ID of the created game.
 */
export const createTestGame = (repo: Repo): DocumentId => {
  const gcg = parseGcg(SAMPLE_GCG)
  const moves = convertGcgToMoves(gcg)

  // Create the board state from the moves
  const board = createEmptyBoardDoc()
  for (const move of moves) {
    for (const { row, col, tile } of move.tilesPlaced) {
      board[row][col] = tile
    }
  }

  // Calculate current player (next player after last move)
  const currentPlayerIndex = moves.length > 0 ? (moves[moves.length - 1].playerIndex + 1) % 2 : 0

  const handle = repo.create<GameDoc>()
  handle.change(d => {
    d.players = [
      { name: "Alice", timeRemainingMs: DEFAULT_TIME_MS, color: PLAYER_COLORS[0] },
      { name: "Bob", timeRemainingMs: DEFAULT_TIME_MS, color: PLAYER_COLORS[1] },
    ]
    d.currentPlayerIndex = currentPlayerIndex
    d.board = board
    d.moves = moves
    d.timerEvents = []
    d.status = "playing"
    d.createdAt = Date.now()
    d.updatedAt = Date.now()
  })

  return handle.documentId
}
