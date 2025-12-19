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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export const GameScreen = ({ onEndGame }: Props) => {
  const { currentGame, commitMove, startTimer, stopTimer, endGame } = useGameStore()
  const [newTiles, setNewTiles] = useState<BoardState>(createEmptyBoard)
  const [highlightedTiles, setHighlightedTiles] = useState<Array<{ row: number; col: number }>>([])
  const [showPassConfirm, setShowPassConfirm] = useState(false)

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

    return history // First move first
  }

  // Briefly highlight tiles on the board
  const handleMoveClick = (tiles: Array<{ row: number; col: number }>) => {
    setHighlightedTiles(tiles)
    setTimeout(() => setHighlightedTiles([]), 1500)
  }

  const handleConfirmPass = () => {
    commitMove({
      playerIndex: currentPlayerIndex,
      tilesPlaced: [],
    })
    setNewTiles(createEmptyBoard())
    setShowPassConfirm(false)
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

          const handlePlayerClick = () => {
            // Only current player or next player can be clicked to end turn
            if (!isActive && index !== (currentPlayerIndex + 1) % players.length) return

            const move = boardStateToMove(newTiles)

            if (move.length > 0) {
              // Validate and commit the move
              const validation = validateMove(move, board, isFirstMove)
              if (!validation.valid) {
                toast.error(validation.error)
                return
              }

              commitMove({
                playerIndex: currentPlayerIndex,
                tilesPlaced: move,
              })
              // Clear new tiles for next player
              setNewTiles(createEmptyBoard())
            } else {
              // No tiles placed - show confirmation dialog
              setShowPassConfirm(true)
            }
          }

          return (
            <div
              key={index}
              className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:opacity-80"
              style={{
                backgroundColor: isActive ? `${player.color}20` : 'transparent',
                borderWidth: 2,
                borderColor: isActive ? player.color : 'transparent',
              }}
              onClick={handlePlayerClick}
            >
              {/* Timer circle */}
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-full border-4"
                style={{ borderColor: player.color }}
              >
                <span className="text-xs font-medium">{formatTime(player.timeRemainingMs)}</span>
              </div>

              {/* Player name and score */}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{player.name}</span>
                <span className="text-2xl font-bold">{score}</span>
              </div>
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

      {/* Pass confirmation dialog */}
      <AlertDialog open={showPassConfirm} onOpenChange={setShowPassConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pass turn?</AlertDialogTitle>
            <AlertDialogDescription>
              {players[currentPlayerIndex].name} has not placed any tiles. Are you sure you want to
              pass this turn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPass}>Pass</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

type Props = {
  onEndGame: () => void
}
