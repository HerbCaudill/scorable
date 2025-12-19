import { useState } from 'react'
import { useGameStore, getPlayerScore } from '@/lib/gameStore'
import ScrabbleBoard from './ScrabbleBoard'
import { Button } from '@/components/ui/button'
import { createEmptyBoard, type BoardState } from '@/lib/types'
import { validateMove } from '@/lib/validateMove'
import { boardStateToMove } from '@/lib/boardStateToMove'
import { getWordsFromMove } from '@/lib/getWordsFromMove'
import { calculateMoveScore } from '@/lib/calculateMoveScore'
import { toast } from 'sonner'

export const GameScreen = ({ onEndGame }: Props) => {
  const { currentGame, commitMove, startTimer, stopTimer, endGame } = useGameStore()
  const [newTiles, setNewTiles] = useState<BoardState>(createEmptyBoard)

  if (!currentGame) return null

  const { players, currentPlayerIndex, board, moves, timerRunning } = currentGame
  const isFirstMove = moves.length === 0

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

  const handleDone = () => {
    const move = boardStateToMove(newTiles)

    // Validate move
    const validation = validateMove(move, board, isFirstMove)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    // Commit the move (records history, merges board, advances turn)
    commitMove({
      playerIndex: currentPlayerIndex,
      tilesPlaced: move,
    })

    // Clear new tiles for next player
    setNewTiles(createEmptyBoard())
  }

  // Get word history for a player
  const getPlayerMoveHistory = (playerIndex: number) => {
    let boardState = createEmptyBoard()
    const history: Array<{ words: string[]; score: number }> = []

    for (const move of moves) {
      if (move.playerIndex === playerIndex) {
        const words = getWordsFromMove(move.tilesPlaced, boardState)
        const score = calculateMoveScore({ move: move.tilesPlaced, board: boardState })
        history.push({ words, score })
      }
      // Update board state after each move
      for (const { row, col, tile } of move.tilesPlaced) {
        boardState[row][col] = tile
      }
    }

    return history.reverse() // Most recent first
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Board area */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <ScrabbleBoard tiles={board} newTiles={newTiles} onNewTilesChange={setNewTiles} editable />
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
          const moveHistory = getPlayerMoveHistory(index)

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

              {/* Word history */}
              {moveHistory.length > 0 && (
                <div className="mt-2 max-h-24 w-full overflow-y-auto text-xs">
                  {moveHistory.map((entry, i) => (
                    <div key={i} className="flex justify-between gap-2 text-gray-600">
                      <span className="truncate">{entry.words.join(', ') || '(pass)'}</span>
                      <span className="font-medium">+{entry.score}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Done button for active player */}
              {isActive && (
                <Button size="sm" className="mt-2" onClick={handleDone}>
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
