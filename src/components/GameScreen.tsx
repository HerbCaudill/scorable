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
  const [highlightedTiles, setHighlightedTiles] = useState<Array<{ row: number; col: number }>>([])

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
    if (timerRunning) stopTimer()
    else startTimer()
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
    const history: Array<{ words: string[]; score: number; tiles: Array<{ row: number; col: number }> }> = []

    for (const move of moves) {
      if (move.playerIndex === playerIndex) {
        const words = getWordsFromMove(move.tilesPlaced, boardState)
        const score = calculateMoveScore({ move: move.tilesPlaced, board: boardState })
        const tiles = move.tilesPlaced.map(({ row, col }) => ({ row, col }))
        history.push({ words, score, tiles })
      }
      // Update board state after each move
      for (const { row, col, tile } of move.tilesPlaced) {
        boardState[row][col] = tile
      }
    }

    return history.reverse() // Most recent first
  }

  // Briefly highlight tiles on the board
  const handleMoveClick = (tiles: Array<{ row: number; col: number }>) => {
    setHighlightedTiles(tiles)
    setTimeout(() => setHighlightedTiles([]), 1500)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Board area */}
      <div className="flex flex-col items-center p-4 pb-2">
        <ScrabbleBoard
          tiles={board}
          newTiles={newTiles}
          onNewTilesChange={setNewTiles}
          editable
          highlightedTiles={highlightedTiles}
        />
      </div>

      {/* Player panels */}
      <div className="flex gap-2 px-4 pt-0">
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

      {/* Game history */}
      {moves.length > 0 && (
        <div className="flex gap-2 px-4">
          {players.map((_, index) => {
            const moveHistory = getPlayerMoveHistory(index)
            return (
              <div key={index} className="flex-1 flex flex-col text-xs p-2 divide-y divide-neutral-200">
                {moveHistory.map((entry, i) => (
                  <div
                    key={i}
                    className="flex cursor-pointer justify-between gap-2 py-1 text-neutral-600 hover:bg-neutral-100"
                    onClick={() => handleMoveClick(entry.tiles)}
                  >
                    <span className="truncate">{entry.words.join(', ') || '(pass)'}</span>
                    <span className="font-medium">{entry.score}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Spacer to push footer down */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="flex justify-center gap-4 border-t bg-white p-4">
        <Button variant="outline" size="sm" onClick={handleTimerToggle}>
          {timerRunning ? '⏸ Pause timer' : '▶ Start timer'}
        </Button>
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
