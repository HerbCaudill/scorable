import type { GameDoc } from "./automergeTypes"
import type { BoardState, Move } from "./types"
import { calculateMoveScore } from "./calculateMoveScore"
import { getWordsFromMove } from "./getWordsFromMove"

export type MoveData = {
  value: number
  label: string // e.g., "CAT for 12"
}

/** Get all move scores with labels for a specific player from a GameDoc */
export const getMoveDataFromDoc = (doc: GameDoc, playerIndex: number): MoveData[] => {
  const moveData: MoveData[] = []
  let boardState: BoardState = Array.from({ length: 15 }, () =>
    Array.from({ length: 15 }, () => null),
  )

  for (const move of doc.moves) {
    // Convert TilePlacement[] to Move type
    const moveAsTiles: Move = move.tilesPlaced.map(t => ({
      row: t.row,
      col: t.col,
      tile: t.tile,
    }))

    if (move.playerIndex === playerIndex) {
      // Only include actual moves (not pass moves or adjustments)
      if (moveAsTiles.length > 0) {
        const score = calculateMoveScore({ move: moveAsTiles, board: boardState })
        const words = getWordsFromMove(moveAsTiles, boardState)
        const mainWord = words[0]?.toUpperCase() ?? ""

        moveData.push({
          value: score,
          label: mainWord ? `${mainWord} for ${score}` : `${score} pts`,
        })
      }
    }

    // Update board state after each move
    for (const { row, col, tile } of move.tilesPlaced) {
      boardState[row][col] = tile
    }
  }

  return moveData
}
