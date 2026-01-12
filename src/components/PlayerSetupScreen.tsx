import { useRepo } from "@automerge/automerge-repo-react-hooks"
import type { DocumentId } from "@automerge/automerge-repo"
import { PlayerSetup } from "./PlayerSetup"
import { useLocalStore } from "@/lib/localStore"
import { createEmptyBoardDoc, type GameDoc } from "@/lib/automergeTypes"
import { PLAYER_COLORS, DEFAULT_TIME_MS } from "@/lib/types"
import { Header } from "./Header"

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
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-md px-4">
        <Header title="New game" onBack={onBack} />

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
