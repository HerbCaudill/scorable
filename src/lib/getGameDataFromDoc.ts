import type { GameDoc } from "./automergeTypes"
import { getPlayerScoreFromDoc } from "./getPlayerScoreFromDoc"
import { formatDate } from "./formatDate"

export type GameData = {
  value: number
  label: string // e.g., "Jan 5 vs Bob: 312"
  gameId?: string // Optional game ID for linking to the game
}

/** Get game score with label for a specific player from a GameDoc */
export const getGameDataFromDoc = (
  doc: GameDoc,
  playerIndex: number,
  gameId?: string,
): GameData => {
  const score = getPlayerScoreFromDoc(doc, playerIndex)
  const date = formatDate(doc.createdAt)

  // Get opponent names (all other players)
  const opponents = doc.players
    .filter((_, i) => i !== playerIndex)
    .map(p => p.name)
    .join(", ")

  return {
    value: score,
    label: `${date} vs ${opponents}: ${score}`,
    gameId,
  }
}
