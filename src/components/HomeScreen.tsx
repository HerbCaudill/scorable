import { Button } from '@/components/ui/button'
import { useLocalStore } from '@/lib/localStore'
import { useDocuments } from '@automerge/automerge-repo-react-hooks'
import type { DocumentId } from '@automerge/automerge-repo'
import type { GameDoc } from '@/lib/automergeTypes'
import { formatDate } from '@/lib/formatDate'
import { getPlayerScoreFromDoc } from '@/lib/getPlayerScoreFromDoc'
import { IconSparkles, IconPlayerPlay, IconTrophyFilled } from '@tabler/icons-react'

export const HomeScreen = ({ onNewGame, onResumeGame, onViewPastGame }: Props) => {
  const { knownGameIds } = useLocalStore()

  // Load all known game documents
  const [docs] = useDocuments<GameDoc>(knownGameIds as any)

  // Separate active and finished games
  const activeGames: Array<{ id: DocumentId; doc: GameDoc }> = []
  const finishedGames: Array<{ id: DocumentId; doc: GameDoc }> = []

  for (const id of knownGameIds) {
    const doc = docs.get(id as any)
    if (doc) {
      if (doc.status === 'finished') {
        finishedGames.push({ id, doc })
      } else {
        activeGames.push({ id, doc })
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6">
        {/* Main actions */}
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={onNewGame} className="w-full">
            <IconSparkles size={20} />
            New game
          </Button>
        </div>

        {/* Active games */}
        {activeGames.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-gray-500">Active games</h2>
            <div className="flex flex-col gap-2">
              {activeGames.map(({ id, doc }) => (
                <div
                  key={id}
                  onClick={() => onResumeGame(id)}
                  className="flex cursor-pointer items-center justify-between rounded border border-gray-200 bg-white p-3 hover:bg-gray-50"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">{formatDate(doc.createdAt)}</span>
                    <span className="text-xs text-gray-400">{doc.players.map(p => p.name).join(' vs ')}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <IconPlayerPlay size={16} />
                    Resume
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past games */}
        {finishedGames.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-gray-500">Past games</h2>
            <div className="flex flex-col gap-2">
              {finishedGames.map(({ id, doc }) => {
                const scores = doc.players.map((_, i) => getPlayerScoreFromDoc(doc, i))
                const maxScore = Math.max(...scores)
                return (
                  <div
                    key={id}
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
                            {isWinner && <IconTrophyFilled size={16} className="text-amber-500" />}
                          </div>
                        )
                      })}
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
  onResumeGame: (id: DocumentId) => void
  onViewPastGame: (id: DocumentId) => void
}
