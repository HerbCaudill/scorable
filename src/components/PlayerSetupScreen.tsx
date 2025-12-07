import { PlayerSetup } from './PlayerSetup'
import { useGameStore } from '@/lib/gameStore'

export const PlayerSetupScreen = ({ onStartGame, onBack }: Props) => {
  const { getPlayerNames, startGame } = useGameStore()
  const previousPlayers = getPlayerNames()

  const handleStartGame = (players: string[]) => {
    startGame(players)
    onStartGame()
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
          ← Back
        </button>

        {/* Player setup form */}
        <PlayerSetup previousPlayers={previousPlayers} onStartGame={handleStartGame} />
      </div>
    </div>
  )
}

type Props = {
  onStartGame: () => void
  onBack: () => void
}
