import { Button } from '@/components/ui/button'
import { useLocalStore } from '@/lib/localStore'
import { useDocuments } from '@automerge/automerge-repo-react-hooks'
import type { DocumentId } from '@automerge/automerge-repo'
import type { GameDoc } from '@/lib/automergeTypes'
import { formatDate } from '@/lib/formatDate'
import { toDocumentId } from '@/lib/useGameId'
import { IconSparkles, IconPlayerPlay, IconTrophyFilled, IconLink } from '@tabler/icons-react'
import { useState } from 'react'

/** Calculate player score from moves - simplified version for display */
const getPlayerScoreFromDoc = (doc: GameDoc, playerIndex: number): number => {
  // This is a simplified calculation for display purposes
  // The full calculation with multipliers happens when viewing the game
  let score = 0
  for (const move of doc.moves) {
    if (move.playerIndex === playerIndex) {
      // Just count tiles * 1 as rough estimate for display
      score += move.tilesPlaced.length
      if (move.adjustment) {
        score += move.adjustment.deduction + move.adjustment.bonus
      }
    }
  }
  return score
}

export const HomeScreen = ({ onNewGame, onResumeGame, onViewPastGame }: Props) => {
  const { knownGameIds } = useLocalStore()
  const [joinId, setJoinId] = useState('')

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

  const handleJoinGame = () => {
    const id = toDocumentId(joinId)
    if (id) {
      onResumeGame(id)
      setJoinId('')
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

        {/* Join game by ID */}
        <div className="flex gap-2">
          <input
            type="text"
            value={joinId}
            onChange={e => setJoinId(e.target.value)}
            placeholder="Paste game ID to join..."
            className="bg-white flex-1 rounded border px-3 py-2 text-sm"
          />
          <Button variant="outline" onClick={handleJoinGame} disabled={!joinId.trim()}>
            <IconLink size={16} />
            Join
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
