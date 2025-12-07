import { useGameStore, getPlayerScore } from '@/lib/gameStore'
import ScrabbleBoard from './ScrabbleBoard'
import { Button } from './Button'

export const GameScreen = ({ onEndGame }: Props) => {
  const { currentGame, updateBoard, startTimer, stopTimer, nextTurn, endGame } = useGameStore()

  if (!currentGame) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">No active game</p>
      </div>
    )
  }

  const { players, currentPlayerIndex, board, timerRunning } = currentGame

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60_000)
    const seconds = Math.floor((ms % 60_000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleEndGame = () => {
    endGame()
    onEndGame()
  }

  const handleTimerToggle = () => {
    if (timerRunning) {
      stopTimer()
    } else {
      startTimer()
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Board area */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <ScrabbleBoard tiles={board} onTilesChange={updateBoard} editable />
      </div>

      {/* Timer control */}
      <div className="flex justify-center p-2">
        <Button variant="outline" size="sm" onClick={handleTimerToggle}>
          {timerRunning ? '⏸ pause timer' : '▶ start timer'}
        </Button>
      </div>

      {/* Player panels */}
      <div className="flex gap-2 p-4">
        {players.map((player, index) => {
          const isActive = index === currentPlayerIndex
          const score = getPlayerScore(currentGame, index)

          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center rounded-lg p-3 transition-colors"
              style={{
                backgroundColor: isActive ? `${player.color}20` : 'transparent',
                borderWidth: 2,
                borderColor: isActive ? player.color : 'transparent',
              }}
            >
              {/* Timer circle */}
              <div
                className="mb-2 flex size-16 items-center justify-center rounded-full border-4"
                style={{ borderColor: player.color }}
              >
                <span className="text-xs font-medium">{formatTime(player.timeRemainingMs)}</span>
              </div>

              {/* Player name */}
              <span className="text-sm font-medium">{player.name}</span>

              {/* Score */}
              <span className="text-2xl font-bold">{score}</span>

              {/* Next turn button for active player */}
              {isActive && (
                <Button size="sm" className="mt-2" onClick={nextTurn}>
                  Done
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* End game button */}
      <div className="flex justify-center p-4 pt-0">
        <Button variant="outline" size="sm" onClick={handleEndGame}>
          End game
        </Button>
      </div>
    </div>
  )
}

type Props = {
  onEndGame: () => void
}
