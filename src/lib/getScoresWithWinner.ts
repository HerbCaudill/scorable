import type { Game } from './types'
import { getPlayerScore } from './getPlayerScore'

export type PlayerScore = {
  name: string
  score: number
  isWinner: boolean
}

export const getScoresWithWinner = (game: Game): PlayerScore[] => {
  const scores = game.players.map((player, index) => ({
    name: player.name,
    score: getPlayerScore(game, index),
  }))
  const maxScore = Math.max(...scores.map(s => s.score))
  return scores.map(s => ({ ...s, isWinner: s.score === maxScore }))
}
