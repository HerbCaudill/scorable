import {
  type Game,
  type GameMove,
  type BoardState,
  type Player,
  DEFAULT_TIME_MS,
} from "../../src/lib/types"
import { parseGcg, type GcgGame, type GcgPlayMove } from "../../src/lib/parseGcg"

const PLAYER_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"]

function createEmptyBoard(): BoardState {
  return Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
}

/** Convert a GCG word with dots (for through-tiles) to individual tile placements */
function wordToTiles(
  word: string,
  position: { row: number; col: number; direction: "horizontal" | "vertical" },
  board: BoardState,
): Array<{ row: number; col: number; tile: string }> {
  const tiles: Array<{ row: number; col: number; tile: string }> = []
  let { row, col } = position
  const { direction } = position

  for (const char of word) {
    if (char === ".") {
      // This is a through-tile (already on board), skip it
    } else {
      // This is a new tile being placed
      // Lowercase letters represent blanks playing as that letter
      const tile = char === char.toLowerCase() ? " " : char
      tiles.push({ row, col, tile })
    }

    // Move to next position
    if (direction === "horizontal") {
      col++
    } else {
      row++
    }
  }

  return tiles
}

/** Convert a parsed GCG game to our Game type, optionally stopping before the last N moves */
export function gcgToGame(
  gcgGame: GcgGame,
  options: { stopBeforeEnd?: number; playerNames?: [string, string] } = {},
): Game {
  const { stopBeforeEnd = 0, playerNames } = options

  const players: Player[] = [
    {
      name: playerNames?.[0] ?? (gcgGame.player1.name || gcgGame.player1.nickname),
      timeRemainingMs: DEFAULT_TIME_MS,
      color: PLAYER_COLORS[0],
    },
    {
      name: playerNames?.[1] ?? (gcgGame.player2.name || gcgGame.player2.nickname),
      timeRemainingMs: DEFAULT_TIME_MS,
      color: PLAYER_COLORS[1],
    },
  ]

  const board = createEmptyBoard()
  const moves: GameMove[] = []

  // Map player nicknames to indices
  const playerIndexMap: Record<string, number> = {
    [gcgGame.player1.nickname]: 0,
    [gcgGame.player2.nickname]: 1,
  }

  // Filter to only play moves (not exchanges, challenges, or end-game)
  const playMoves = gcgGame.moves.filter((m): m is GcgPlayMove => m.type === "play")

  // Stop before the last N moves if requested
  const movesToProcess = stopBeforeEnd > 0 ? playMoves.slice(0, -stopBeforeEnd) : playMoves

  for (const move of movesToProcess) {
    const playerIndex = playerIndexMap[move.player]
    const tilesPlaced = wordToTiles(move.word, move.position, board)

    // Update board state
    for (const { row, col, tile } of tilesPlaced) {
      board[row][col] = tile
    }

    moves.push({
      playerIndex,
      tilesPlaced,
    })
  }

  // Determine current player (next after last move)
  const lastPlayerIndex = moves.length > 0 ? moves[moves.length - 1].playerIndex : 0
  const currentPlayerIndex = (lastPlayerIndex + 1) % 2

  return {
    players,
    currentPlayerIndex,
    board,
    moves,
    status: "playing",
    timerRunning: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/** Parse a GCG string and convert to Game type */
export function parseGcgToGame(
  gcgContent: string,
  options: { stopBeforeEnd?: number; playerNames?: [string, string] } = {},
): Game {
  const gcgGame = parseGcg(gcgContent)
  return gcgToGame(gcgGame, options)
}
