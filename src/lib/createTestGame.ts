import type { Repo } from "@automerge/automerge-repo"
import type { DocumentId } from "@automerge/automerge-repo"
import { parseGcg, type GcgGame, type GcgPlayMove } from "./parseGcg"
import { createEmptyBoardDoc, type GameDoc, type GameMoveDoc } from "./automergeTypes"
import { PLAYER_COLORS, DEFAULT_TIME_MS, type GameStatus } from "./types"
import { gcgFiles } from "./gcgData"

/**
 * Convert a GCG game to game moves.
 * @param swapPlayers - If true, swap player indices (player1 becomes index 1, player2 becomes index 0)
 */
const convertGcgToMoves = (gcg: GcgGame, swapPlayers: boolean = false): GameMoveDoc[] => {
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
    const baseIndex = move.player === gcg.player1.nickname ? 0 : 1
    const playerIndex = swapPlayers ? 1 - baseIndex : baseIndex

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
      moves.push({ playerIndex, tilesPlaced })
    }
  }

  return moves
}

type CreateGameOptions = {
  gcgContent: string
  /** If provided, only include this many moves (for creating in-progress games) */
  movesToInclude?: number
  /** Game status - defaults to 'finished' */
  status?: GameStatus
  /** If true, swap player order so player2 plays first */
  swapPlayers?: boolean
}

/**
 * Create a test game from GCG content.
 * Returns the document ID of the created game.
 */
export const createTestGame = (repo: Repo, options: CreateGameOptions): DocumentId => {
  const { gcgContent, movesToInclude, status = "finished", swapPlayers = false } = options
  const gcg = parseGcg(gcgContent)
  let moves = convertGcgToMoves(gcg, swapPlayers)

  // Limit moves if specified
  if (movesToInclude !== undefined && movesToInclude < moves.length) {
    moves = moves.slice(0, movesToInclude)
  }

  // Create the board state from the moves
  const board = createEmptyBoardDoc()
  for (const move of moves) {
    for (const { row, col, tile } of move.tilesPlaced) {
      board[row][col] = tile
    }
  }

  // Calculate current player (next player after last move)
  const currentPlayerIndex = moves.length > 0 ? (moves[moves.length - 1].playerIndex + 1) % 2 : 0

  // Determine player order based on swapPlayers
  const [firstPlayer, secondPlayer] =
    swapPlayers ? [gcg.player2, gcg.player1] : [gcg.player1, gcg.player2]

  const handle = repo.create<GameDoc>()
  handle.change(d => {
    d.players = [
      { name: firstPlayer.name, timeRemainingMs: DEFAULT_TIME_MS, color: PLAYER_COLORS[0] },
      { name: secondPlayer.name, timeRemainingMs: DEFAULT_TIME_MS, color: PLAYER_COLORS[1] },
    ]
    d.currentPlayerIndex = currentPlayerIndex
    d.board = board
    d.moves = moves
    d.timerEvents = []
    d.status = status
    d.createdAt = Date.now()
    d.updatedAt = Date.now()
  })

  return handle.documentId
}

type TestGameInfo = {
  id: DocumentId
  playerNames: [string, string]
}

/**
 * Create multiple test games from all available GCG files.
 * - Most games are created as finished
 * - Two games are created as in-progress
 * - One of the in-progress games has all moves except the last
 * - Randomly determines which player starts first for each game
 */
export const createTestGames = (repo: Repo): TestGameInfo[] => {
  const games: TestGameInfo[] = []

  gcgFiles.forEach((file, index) => {
    const gcg = parseGcg(file.content)
    const allMoves = convertGcgToMoves(gcg)

    // Randomly determine if players should be swapped
    const swapPlayers = Math.random() < 0.5

    // Player names in the order they appear in the game
    const playerNames: [string, string] =
      swapPlayers ? [gcg.player2.name, gcg.player1.name] : [gcg.player1.name, gcg.player2.name]

    let options: CreateGameOptions

    if (index === 0) {
      // First game: in-progress with all moves except the last
      options = {
        gcgContent: file.content,
        movesToInclude: Math.max(1, allMoves.length - 1),
        status: "playing",
        swapPlayers,
      }
    } else if (index === 1) {
      // Second game: in-progress, mid-game (half the moves)
      options = {
        gcgContent: file.content,
        movesToInclude: Math.max(1, Math.floor(allMoves.length / 2)),
        status: "playing",
        swapPlayers,
      }
    } else {
      // All other games: finished
      options = {
        gcgContent: file.content,
        status: "finished",
        swapPlayers,
      }
    }

    const id = createTestGame(repo, options)
    games.push({ id, playerNames })
  })

  return games
}
