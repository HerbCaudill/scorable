import { useGameStore, getPlayerScore } from '@/lib/gameStore'
import ScrabbleBoard from './ScrabbleBoard'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/formatDate'
import { getPlayerMoveHistory } from '@/lib/getPlayerMoveHistory'
import { MoveHistoryList } from './MoveHistoryList'
import { useHighlightedTiles } from '@/hooks/useHighlightedTiles'
import { IconArrowLeft, IconHome } from '@tabler/icons-react'

export const PastGameScreen = ({ gameId, onBack }: Props) => {
  const { pastGames } = useGameStore()
  const game = pastGames.find(g => g.id === gameId)
  const { highlightedTiles, highlightTiles } = useHighlightedTiles()

  if (!game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-500">Game not found</p>
        <Button onClick={onBack}>
          <IconHome size={16} />
          Back to Home
        </Button>
      </div>
    )
  }

  const { players, board, moves } = game

  // Calculate scores and determine winner
  const scores = players.map((_, index) => getPlayerScore(game, index))
  const maxScore = Math.max(...scores)

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <IconArrowLeft size={16} />
          Back
        </Button>
        <span className="text-sm text-gray-500">{formatDate(game.createdAt, { includeYear: true })}</span>
      </div>

      {/* Board - read-only */}
      <div className="flex flex-col items-center p-4 pb-2">
        <ScrabbleBoard tiles={board} highlightedTiles={highlightedTiles} />
      </div>

      {/* Final scores */}
      <div className="flex gap-2 px-4 pt-0">
        {players.map((player, index) => {
          const score = scores[index]
          const isWinner = score === maxScore

          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center rounded-lg p-3"
              style={{
                backgroundColor: isWinner ? `${player.color}20` : 'transparent',
                borderWidth: 2,
                borderColor: isWinner ? player.color : 'transparent',
              }}
            >
              <span className="text-sm font-medium">{player.name}</span>
              <span className="text-2xl font-bold">{score}</span>
              {isWinner && <span className="text-amber-500">★ Winner</span>}
            </div>
          )
        })}
      </div>

      {/* Game history */}
      {moves.length > 0 && (
        <div className="flex gap-2 overflow-y-auto px-4">
          {players.map((_, index) => {
            const moveHistory = getPlayerMoveHistory(moves, index, { newestFirst: true })
            return (
              <MoveHistoryList
                key={index}
                history={moveHistory}
                onMoveClick={highlightTiles}
                className="flex-1 p-2 text-xs"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

type Props = {
  gameId: string
  onBack: () => void
}
