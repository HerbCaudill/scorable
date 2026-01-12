import { useState } from "react"
import type { DocumentId } from "@automerge/automerge-repo"
import { useGame } from "@/lib/useGame"
import { useLocalStore } from "@/lib/localStore"
import { getPlayerScore } from "@/lib/getPlayerScore"
import ScrabbleBoard from "./ScrabbleBoard"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "./ConfirmDialog"
import { formatDate } from "@/lib/formatDate"
import { getPlayerMoveHistory } from "@/lib/getPlayerMoveHistory"
import { MoveHistoryList } from "./MoveHistoryList"
import { useHighlightedTiles } from "@/hooks/useHighlightedTiles"
import { IconHome, IconTrash, IconTrophyFilled } from "@tabler/icons-react"
import { Header } from "./Header"

export const PastGameScreen = ({ gameId, onBack }: Props) => {
  const { game, isLoading, isUnavailable } = useGame(gameId)
  const { highlightedTiles, highlightTiles } = useHighlightedTiles()
  const removeGameId = useLocalStore(s => s.removeGameId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    removeGameId(gameId)
    onBack()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-500">Loading game...</p>
      </div>
    )
  }

  if (isUnavailable || !game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-500">Game not found</p>
        <Button onClick={onBack}>
          <IconHome size={16} />
          Back to home
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
      <Header
        onBack={onBack}
        border
        rightContent={
          <span className="text-sm text-gray-500">
            {formatDate(game.createdAt, { includeYear: true })}
          </span>
        }
      />

      {/* Board - read-only */}
      <div className="flex flex-col items-center p-2 pb-2">
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
                backgroundColor: isWinner ? `${player.color}20` : "transparent",
                borderWidth: 2,
                borderColor: isWinner ? player.color : "transparent",
              }}
            >
              <span className="text-sm font-medium">{player.name}</span>
              <span className="text-2xl font-bold">{score}</span>
              {isWinner && (
                <span className="flex items-center gap-1 text-xs text-amber-500">
                  <IconTrophyFilled size={16} />
                  Winner
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Delete button */}
      <div className="px-4 py-2">
        <Button
          variant="outline"
          className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <IconTrash size={16} />
          Delete game
        </Button>
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
                disableActions
                className="flex-1 p-1 text-xs"
              />
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete game?"
        description="This game will be removed from your history. This cannot be undone."
        confirmText="Delete"
        confirmClassName="bg-red-600 hover:bg-red-700"
        onConfirm={handleDelete}
      />
    </div>
  )
}

type Props = {
  gameId: DocumentId
  onBack: () => void
}
