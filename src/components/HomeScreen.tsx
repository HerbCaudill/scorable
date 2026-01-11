import { Button } from "@/components/ui/button"
import { useLocalStore } from "@/lib/localStore"
import { useDocuments, useRepo } from "@automerge/automerge-repo-react-hooks"
import type { DocumentId } from "@automerge/automerge-repo"
import type { GameDoc } from "@/lib/automergeTypes"
import { formatDate } from "@/lib/formatDate"
import { getPlayerScoreFromDoc } from "@/lib/getPlayerScoreFromDoc"
import {
  IconSparkles,
  IconPlayerPlay,
  IconTrophyFilled,
  IconTestPipe,
  IconChartBar,
} from "@tabler/icons-react"
import { SwipeToDelete } from "@/components/SwipeToDelete"
import { createTestGame } from "@/lib/createTestGame"

export const HomeScreen = ({
  onNewGame,
  onResumeGame,
  onViewPastGame,
  onViewStatistics,
}: Props) => {
  const repo = useRepo()
  const { knownGameIds, removeGameId, addGameId, addPlayerRecord } = useLocalStore()

  // Load all known game documents
  const [docs] = useDocuments<GameDoc>(knownGameIds as any)

  // Separate active and finished games
  const activeGames: Array<{ id: DocumentId; doc: GameDoc }> = []
  const finishedGames: Array<{ id: DocumentId; doc: GameDoc }> = []

  for (const id of knownGameIds) {
    const doc = docs.get(id as any)
    if (doc) {
      if (doc.status === "finished") {
        finishedGames.push({ id, doc })
      } else {
        activeGames.push({ id, doc })
      }
    }
  }

  const handleCreateTestGame = () => {
    const gameId = createTestGame(repo)
    addGameId(gameId)
    addPlayerRecord("Alice")
    addPlayerRecord("Bob")
    onResumeGame(gameId)
  }

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="flex items-center gap-2">
            {/* Simple tile-style logo */}
            <div className="relative flex h-10 w-10 -rotate-12 items-center justify-center rounded bg-amber-100 font-bold text-amber-900 shadow-[0_3px_0_0_rgba(0,0,0,0.15)]">
              <span className="text-2xl">S</span>
              <span className="absolute bottom-0.5 right-1 text-[8px]">1</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-800">Scorable</h1>
          </div>
        </div>

        {/* Main actions */}
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={onNewGame} className="w-full">
            <IconSparkles size={20} />
            New game
          </Button>
          <Button variant="outline" onClick={handleCreateTestGame} className="w-full">
            <IconTestPipe size={20} />
            Create test game
          </Button>
        </div>

        {/* Active games */}
        {activeGames.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-gray-500">Active games</h2>
            <div className="flex flex-col gap-2">
              {activeGames.map(({ id, doc }) => (
                <SwipeToDelete key={id} onDelete={() => removeGameId(id)} className="rounded">
                  <div
                    onClick={() => onResumeGame(id)}
                    className="flex cursor-pointer items-center justify-between rounded border border-gray-200 bg-white p-3 hover:bg-gray-50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">{formatDate(doc.createdAt)}</span>
                      <span className="text-xs text-gray-400">
                        {doc.players.map(p => p.name).join(" vs ")}
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      <IconPlayerPlay size={16} />
                      Resume
                    </Button>
                  </div>
                </SwipeToDelete>
              ))}
            </div>
          </div>
        )}

        {/* Past games */}
        {finishedGames.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-500">Past games</h2>
              {onViewStatistics && (
                <button
                  onClick={onViewStatistics}
                  className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                >
                  <IconChartBar size={16} />
                  Statistics
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {finishedGames.map(({ id, doc }) => {
                const scores = doc.players.map((_, i) => getPlayerScoreFromDoc(doc, i))
                const maxScore = Math.max(...scores)
                return (
                  <SwipeToDelete key={id} onDelete={() => removeGameId(id)} className="rounded">
                    <div
                      onClick={() => onViewPastGame(id)}
                      className="flex cursor-pointer items-center justify-between rounded border border-gray-200 bg-white p-3 hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-500">{formatDate(doc.createdAt)}</span>
                      <div className="flex gap-4">
                        {doc.players.map((player, playerIndex) => {
                          const score = scores[playerIndex]
                          const isWinner = score === maxScore
                          return (
                            <div key={playerIndex} className="flex items-center gap-1">
                              <span className="text-sm">{player.name}</span>
                              <span className="font-medium">{score}</span>
                              {isWinner && (
                                <IconTrophyFilled size={16} className="text-amber-500" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </SwipeToDelete>
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
  onResumeGame: (id: DocumentId) => void
  onViewPastGame: (id: DocumentId) => void
  onViewStatistics?: () => void
}
