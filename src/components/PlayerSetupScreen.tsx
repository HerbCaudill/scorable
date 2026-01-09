import { useRepo } from "@automerge/automerge-repo-react-hooks"
import type { DocumentId } from "@automerge/automerge-repo"
import { PlayerSetup } from "./PlayerSetup"
import { useLocalStore } from "@/lib/localStore"
import { createEmptyBoardDoc, type GameDoc } from "@/lib/automergeTypes"
import { PLAYER_COLORS, DEFAULT_TIME_MS } from "@/lib/types"
import { IconArrowLeft } from "@tabler/icons-react"

export const PlayerSetupScreen = ({ onGameCreated, onBack }: Props) => {
  const repo = useRepo()
  const { addGameId, addPlayerRecord, getPlayerNames } = useLocalStore()
  const previousPlayers = getPlayerNames()

  const handleStartGame = (playerNames: string[]) => {
    try {
      // Create new automerge document
      const handle = repo.create<GameDoc>()

      handle.change(d => {
        d.players = playerNames.map((name, i) => ({
          name,
          timeRemainingMs: DEFAULT_TIME_MS,
          color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        }))
        d.currentPlayerIndex = 0
        d.board = createEmptyBoardDoc()
        d.moves = []
        d.timerEvents = []
        d.status = "playing"
        d.createdAt = Date.now()
        d.updatedAt = Date.now()
      })

      // Save to local bookmarks
      addGameId(handle.documentId)

      // Update player records
      for (const name of playerNames) {
        addPlayerRecord(name)
      }

      onGameCreated(handle.documentId)
    } catch (error) {
      console.error("Failed to create game:", error)
      alert(`Failed to create game: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mx-auto w-full max-w-md">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <IconArrowLeft size={16} />
          Back
        </button>

        {/* Player setup form */}
        <PlayerSetup previousPlayers={previousPlayers} onStartGame={handleStartGame} />
      </div>
    </div>
  )
}

type Props = {
  onGameCreated: (id: DocumentId) => void
  onBack: () => void
}
