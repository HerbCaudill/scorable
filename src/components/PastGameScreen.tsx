import { useState } from "react"
import type { DocumentId } from "@automerge/automerge-repo"
import { useGame } from "@/lib/useGame"
import { useLocalStore } from "@/lib/localStore"
import { getPlayerScore } from "@/lib/getPlayerScore"
import { darkenColor } from "@/lib/utils"
import ScrabbleBoard from "./ScrabbleBoard"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "./ConfirmDialog"
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
    <div className="flex h-dvh flex-col gap-3 overflow-hidden p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Top navigation bar */}
      <div className="shrink-0">
        <Header onBack={onBack} />
      </div>

      {/* Board - read-only */}
      <div className="shrink-0">
        <div className="flex flex-col items-center w-full">
          <ScrabbleBoard tiles={board} highlightedTiles={highlightedTiles} />
        </div>
      </div>

      {/* Player panels + history - scroll together horizontally, each panel scrolls vertically */}
      <div className="min-h-0 flex-1 overflow-x-auto -mx-2 px-2 py-1">
        <div className="flex h-full w-full gap-3">
          {players.map((player, index) => {
            const score = scores[index]
            const isWinner = score === maxScore
            const moveHistory = getPlayerMoveHistory(moves, index)

            return (
              <div
                key={index}
                role="region"
                aria-label={`${player.name}'s score panel`}
                data-player={player.name}
                className="flex min-h-0 min-w-40 flex-1 flex-col rounded-lg bg-white"
                style={{
                  boxShadow: `0 0 0 ${isWinner ? 3 : 1}px ${isWinner ? player.color : `${player.color}40`}, 0 3px 0 0 ${isWinner ? darkenColor(player.color) : `${darkenColor(player.color)}40`}`,
                }}
              >
                {/* Player panel header */}
                <div
                  className="shrink-0 flex items-center gap-3 p-2"
                  style={{
                    backgroundColor: isWinner ? `${player.color}20` : "transparent",
                    borderBottomWidth: 2,
                    borderBottomColor: isWinner ? player.color : `${player.color}20`,
                  }}
                >
                  {/* Winner trophy */}
                  {isWinner && <IconTrophyFilled size={24} className="text-amber-500" />}

                  {/* Player name and score */}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{player.name}</span>
                    <span className="text-2xl font-bold">{score}</span>
                  </div>
                </div>

                {/* Move history for this player - scrolls independently */}
                <MoveHistoryList
                  history={moveHistory}
                  onMoveClick={highlightTiles}
                  disableActions
                  className="min-h-0 flex-1 overflow-y-auto p-1 text-xs [&_span:first-child]:font-mono"
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer with action buttons */}
      <div className="shrink-0 overflow-x-auto scrollbar-none -mx-2 px-2 pb-1 relative z-60">
        <div className="flex gap-2 w-max">
          <Button
            variant="outline"
            size="xs"
            className="text-red-600 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <IconTrash size={14} />
            Delete
          </Button>
        </div>
      </div>

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
