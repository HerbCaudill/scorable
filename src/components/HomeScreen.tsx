import { Button } from '@/components/ui/button'
import { useGameStore, getPlayerScore } from '@/lib/gameStore'
import type { Game } from '@/lib/types'

export const HomeScreen = ({ onNewGame, onResumeGame, onViewPastGame }: Props) => {
  const { currentGame, pastGames } = useGameStore()
  const hasCurrentGame = currentGame !== null && currentGame.status !== 'finished'

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getScoresWithWinner = (game: Game) => {
    const scores = game.players.map((player, index) => ({
      name: player.name,
      score: getPlayerScore(game, index),
    }))
    const maxScore = Math.max(...scores.map(s => s.score))
    return scores.map(s => ({ ...s, isWinner: s.score === maxScore }))
  }

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6">
        {/* Main actions */}
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={onNewGame} className="w-full">
            New game
          </Button>
          {hasCurrentGame && (
            <Button size="lg" variant="outline" onClick={onResumeGame} className="w-full">
              Resume game
            </Button>
          )}
        </div>

        {/* Past games */}
        {pastGames.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-gray-500">Past games</h2>
            <div className="flex flex-col gap-2">
              {pastGames.map(game => {
                const scores = getScoresWithWinner(game)
                return (
                  <div
                    key={game.id}
                    onClick={() => onViewPastGame(game.id)}
                    className="flex cursor-pointer items-center justify-between rounded border border-gray-200 bg-white p-3 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-500">{formatDate(game.createdAt)}</span>
                    <div className="flex gap-4">
                      {scores.map((player, playerIndex) => (
                        <div key={playerIndex} className="flex items-center gap-1">
                          <span className="text-sm">{player.name}</span>
                          <span className="font-medium">{player.score}</span>
                          {player.isWinner && <span className="text-amber-500">★</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type Props = {
  onNewGame: () => void
  onResumeGame: () => void
  onViewPastGame: (gameId: string) => void
}
