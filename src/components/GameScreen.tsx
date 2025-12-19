import { useState, useEffect, useRef } from 'react'
import { useGameStore, getPlayerScore } from '@/lib/gameStore'
import ScrabbleBoard from './ScrabbleBoard'
import { Button } from '@/components/ui/button'
import { createEmptyBoard, type BoardState, DEFAULT_TIME_MS } from '@/lib/types'
import { validateMove } from '@/lib/validateMove'
import { boardStateToMove } from '@/lib/boardStateToMove'
import { getWordsFromMove } from '@/lib/getWordsFromMove'
import { calculateMoveScore } from '@/lib/calculateMoveScore'
import { getRemainingTileCount, checkTileOveruse, type TileOveruseWarning } from '@/lib/tileBag'
import { UnplayedTilesScreen } from './TileBagScreen'
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
import { IconPlayerPauseFilled, IconPlayerPlayFilled, IconFlag, IconCards } from '@tabler/icons-react'

export const GameScreen = ({ onEndGame }: Props) => {
  const { currentGame, commitMove, startTimer, stopTimer, endGame, updatePlayerTime } = useGameStore()
  const [newTiles, setNewTiles] = useState<BoardState>(createEmptyBoard)
  const [highlightedTiles, setHighlightedTiles] = useState<Array<{ row: number; col: number }>>([])
  const [showPassConfirm, setShowPassConfirm] = useState(false)
  const [showTileBag, setShowTileBag] = useState(false)
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false)
  const [tileOveruseConfirm, setTileOveruseConfirm] = useState<{
    warnings: TileOveruseWarning[]
    pendingMove: Array<{ row: number; col: number; tile: string }>
  } | null>(null)

  // Timer interval - decrement current player's time every second
  const lastTickRef = useRef<number>(Date.now())
  const timerRunning = currentGame?.timerRunning ?? false
  const currentPlayerIndex = currentGame?.currentPlayerIndex ?? 0

  useEffect(() => {
    if (!timerRunning || !currentGame) return

    lastTickRef.current = Date.now()

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastTickRef.current
      lastTickRef.current = now

      const currentTime = currentGame.players[currentPlayerIndex].timeRemainingMs
      const newTime = Math.max(0, currentTime - elapsed)
      updatePlayerTime(currentPlayerIndex, newTime)
    }, 100) // Update frequently for smooth display

    return () => clearInterval(interval)
  }, [timerRunning, currentPlayerIndex, currentGame, updatePlayerTime])

  if (!currentGame) return null

  if (showTileBag) {
    return <UnplayedTilesScreen onBack={() => setShowTileBag(false)} />
  }

  const { players, board, moves } = currentGame
  const isFirstMove = moves.length === 0

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60_000)
    const seconds = Math.floor((ms % 60_000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const remainingTileCount = getRemainingTileCount(currentGame)

  const handleEndGameClick = () => {
    if (remainingTileCount > 0) {
      setShowEndGameConfirm(true)
    } else {
      endGame()
      onEndGame()
    }
  }

  const handleConfirmEndGame = () => {
    setShowEndGameConfirm(false)
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

  const handleConfirmTileOveruse = () => {
    if (!tileOveruseConfirm) return
    commitMove({
      playerIndex: currentPlayerIndex,
      tilesPlaced: tileOveruseConfirm.pendingMove,
    })
    setNewTiles(createEmptyBoard())
    setTileOveruseConfirm(null)
  }

  return (
    <div className="flex h-screen flex-col overflow-x-hidden">
      {/* Sticky header: Board + Player panels */}
      <div className="sticky top-0 z-10 bg-white">
        {/* Board area */}
        <div className="flex flex-col items-center">
          <ScrabbleBoard
            tiles={board}
            newTiles={newTiles}
            onNewTilesChange={setNewTiles}
            editable
            highlightedTiles={highlightedTiles}
          />
        </div>
      </div>

      {/* Player panels + history - scroll together horizontally */}
      <div className="flex-1 overflow-x-auto overflow-y-auto ">
        <div className="inline-flex gap-3 p-2">
          {players.map((player, index) => {
            const isActive = index === currentPlayerIndex
            const score = getPlayerScore(currentGame, index)
            const moveHistory = getPlayerMoveHistory(index)

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

                // Check for tile overuse and show confirmation dialog
                const overuseWarnings = checkTileOveruse(currentGame, move)
                if (overuseWarnings.length > 0) {
                  setTileOveruseConfirm({ warnings: overuseWarnings, pendingMove: move })
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
                className="flex min-w-32 flex-1 flex-col overflow-hidden rounded-lg"
                style={{
                  boxShadow: isActive
                    ? `0 0 0 3px ${player.color}`
                    : `0 0 0 1px ${player.color}40`,
                }}
              >
                {/* Player panel */}
                <div
                  className="flex cursor-pointer items-center gap-3 p-1 transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: isActive ? `${player.color}20` : 'transparent',
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? player.color : '#e5e5e5',
                  }}
                  onClick={handlePlayerClick}
                >
                  {/* Timer circle with progress */}
                  {(() => {
                    const timeRemainingPercent = Math.max(0, (player.timeRemainingMs / DEFAULT_TIME_MS) * 100)
                    const radius = 20
                    const circumference = 2 * Math.PI * radius
                    const strokeDashoffset = circumference - (timeRemainingPercent / 100) * circumference

                    return (
                      <div
                        className="relative flex size-12 shrink-0 items-center justify-center transition-opacity"
                        style={{ opacity: isActive && timerRunning ? 1 : 0.4 }}
                      >
                        <svg className="absolute size-12 rotate-90 -scale-x-100">
                          {/* Background circle (time used) */}
                          <circle cx="24" cy="24" r={radius} fill="none" stroke="#e5e5e5" strokeWidth="4" />
                          {/* Progress circle (time remaining) */}
                          <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="none"
                            stroke={player.color}
                            strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="text-[10px] font-medium">{formatTime(player.timeRemainingMs)}</span>
                        {!timerRunning && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <IconPlayerPauseFilled size={24} className="opacity-25" />
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Player name and score */}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{player.name}</span>
                    <span className="text-2xl font-bold">{score}</span>
                  </div>
                </div>

                {/* Move history for this player */}
                <div className="flex flex-col divide-y divide-neutral-200 p-2 text-[10px]">
                  {moveHistory.map((entry, i) => (
                    <div
                      key={i}
                      className="flex cursor-pointer justify-between gap-2 py-1 text-neutral-600 hover:bg-neutral-100"
                      onClick={() => handleMoveClick(entry.tiles)}
                    >
                      <span className="truncate font-mono">{entry.words.join(', ') || '(pass)'}</span>
                      <span className="font-medium">{entry.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center gap-2 border-t bg-white p-2">
        <Button variant={timerRunning ? 'outline' : 'default'} size="xs" onClick={handleTimerToggle}>
          {timerRunning ? <IconPlayerPauseFilled size={14} /> : <IconPlayerPlayFilled size={14} />}
          {timerRunning ? 'Pause timer' : 'Start timer'}
        </Button>
        <Button variant="outline" size="xs" onClick={() => setShowTileBag(true)}>
          <IconCards size={14} />
          Tiles ({remainingTileCount})
        </Button>
        <Button variant="outline" size="xs" onClick={handleEndGameClick}>
          <IconFlag size={14} />
          End game
        </Button>
      </div>

      {/* Pass confirmation dialog */}
      <AlertDialog open={showPassConfirm} onOpenChange={setShowPassConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pass turn?</AlertDialogTitle>
            <AlertDialogDescription>
              {players[currentPlayerIndex].name} has not placed any tiles. Are you sure you want to pass this turn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPass}>Pass</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End game confirmation dialog */}
      <AlertDialog open={showEndGameConfirm} onOpenChange={setShowEndGameConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End game?</AlertDialogTitle>
            <AlertDialogDescription>
              There are still {remainingTileCount} unplayed tiles. Are you sure you want to end the game?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEndGame}>End game</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tile overuse confirmation dialog */}
      <AlertDialog open={tileOveruseConfirm !== null} onOpenChange={open => !open && setTileOveruseConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Too many tiles used</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {tileOveruseConfirm && (
                <>
                  This move uses more tiles than exist in the game:
                  <ul className="mt-2 list-disc pl-5">
                    {tileOveruseConfirm.warnings.map((w, i) => (
                      <li key={i}>
                        <strong>{w.tile}</strong>: {w.used} used, but only {w.available} exist
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">Do you want to play this move anyway?</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleConfirmTileOveruse}
              className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Play anyway
            </AlertDialogAction>
            <AlertDialogAction onClick={() => setTileOveruseConfirm(null)}>Fix move</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

type Props = {
  onEndGame: () => void
}
