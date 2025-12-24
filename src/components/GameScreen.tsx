import { useState, useEffect, useRef } from 'react'
import type { AutomergeUrl } from '@automerge/automerge-repo'
import { useGame } from '@/lib/useGame'
import { getPlayerScore } from '@/lib/getPlayerScore'
import ScrabbleBoard from './ScrabbleBoard'
import { Button } from '@/components/ui/button'
import { createEmptyBoard, type BoardState, type GameMove } from '@/lib/types'
import { validateMove } from '@/lib/validateMove'
import { boardStateToMove } from '@/lib/boardStateToMove'
import { checkTileOveruse, type TileOveruseWarning } from '@/lib/checkTileOveruse'
import { getRemainingTileCount } from '@/lib/getRemainingTileCount'
import { getPlayerMoveHistory } from '@/lib/getPlayerMoveHistory'
import { UnplayedTilesScreen } from './TileBagScreen'
import { EndGameScreen } from './EndGameScreen'
import { ConfirmDialog } from './ConfirmDialog'
import { MoveHistoryList } from './MoveHistoryList'
import { Timer } from './Timer'
import { useHighlightedTiles } from '@/hooks/useHighlightedTiles'
import { toast } from 'sonner'
import { IconFlag, IconCards, IconPlayerPause, IconPlayerPlay, IconX } from '@tabler/icons-react'

/** Convert player's move index to global index in moves array */
const getGlobalMoveIndex = (moves: GameMove[], playerIndex: number, playerMoveIndex: number): number => {
  let count = 0
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    if (move.playerIndex === playerIndex && !move.adjustment) {
      if (count === playerMoveIndex) return i
      count++
    }
  }
  return -1
}

/** Convert global move index to player's local move index */
const getPlayerMoveIndex = (
  moves: GameMove[],
  globalIndex: number
): { playerIndex: number; playerMoveIndex: number } | null => {
  if (globalIndex < 0 || globalIndex >= moves.length) return null
  const move = moves[globalIndex]
  if (move.adjustment) return null

  let count = 0
  for (let i = 0; i < globalIndex; i++) {
    if (moves[i].playerIndex === move.playerIndex && !moves[i].adjustment) {
      count++
    }
  }
  return { playerIndex: move.playerIndex, playerMoveIndex: count }
}

/** Build board state excluding a specific move's tiles */
const getBoardExcludingMove = (moves: GameMove[], excludeIndex: number): BoardState => {
  const board = createEmptyBoard()
  for (let i = 0; i < moves.length; i++) {
    if (i === excludeIndex) continue
    for (const { row, col, tile } of moves[i].tilesPlaced) {
      board[row][col] = tile
    }
  }
  return board
}

/** Convert Move to BoardState for editing */
const moveToBoardState = (tilesPlaced: GameMove['tilesPlaced']): BoardState => {
  const board = createEmptyBoard()
  for (const { row, col, tile } of tilesPlaced) {
    board[row][col] = tile
  }
  return board
}

export const GameScreen = ({ gameUrl, onEndGame }: Props) => {
  const {
    game: currentGame,
    isLoading,
    timerRunning,
    startTimer,
    stopTimer,
    commitMove,
    updateMove,
    updatePlayerTime,
    endGame,
    endGameWithAdjustments,
  } = useGame(gameUrl)

  const [newTiles, setNewTiles] = useState<BoardState>(createEmptyBoard)
  const { highlightedTiles, highlightTiles } = useHighlightedTiles()
  const [showPassConfirm, setShowPassConfirm] = useState(false)
  const [showTileBag, setShowTileBag] = useState(false)
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false)
  const [showEndGameScreen, setShowEndGameScreen] = useState(false)
  const [editingMoveIndex, setEditingMoveIndex] = useState<number | null>(null)
  const [tileOveruseConfirm, setTileOveruseConfirm] = useState<{
    warnings: TileOveruseWarning[]
    pendingMove: Array<{ row: number; col: number; tile: string }>
  } | null>(null)

  // Timer interval - decrement current player's time every second
  const lastTickRef = useRef<number>(Date.now())
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading game...</div>
      </div>
    )
  }

  if (!currentGame) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Game not found</div>
      </div>
    )
  }

  if (showTileBag) {
    return <UnplayedTilesScreen game={currentGame} onBack={() => setShowTileBag(false)} />
  }

  if (showEndGameScreen) {
    return (
      <EndGameScreen
        game={currentGame}
        onBack={() => setShowEndGameScreen(false)}
        onApply={adjustments => {
          endGameWithAdjustments(adjustments)
          onEndGame()
        }}
      />
    )
  }

  const { players, board, moves } = currentGame
  const isEditing = editingMoveIndex !== null
  const editingMoveInfo = editingMoveIndex !== null ? getPlayerMoveIndex(moves, editingMoveIndex) : null

  // Board to display: when editing, exclude the move being edited
  const displayBoard = isEditing ? getBoardExcludingMove(moves, editingMoveIndex) : board

  // For validation: first move = no tiles placed before this point
  const isFirstMove = isEditing
    ? !moves.slice(0, editingMoveIndex).some(m => m.tilesPlaced.length > 0)
    : board.every(row => row.every(cell => cell === null))

  // Handle entering edit mode
  const handleEditMove = (playerIndex: number, playerMoveIndex: number) => {
    // Block if tiles are in progress
    const hasTilesInProgress = newTiles.some(row => row.some(cell => cell !== null))
    if (hasTilesInProgress) {
      toast.error('Clear current move first')
      return
    }

    const globalIndex = getGlobalMoveIndex(moves, playerIndex, playerMoveIndex)
    if (globalIndex === -1) return

    setEditingMoveIndex(globalIndex)
    setNewTiles(moveToBoardState(moves[globalIndex].tilesPlaced))
  }

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingMoveIndex(null)
    setNewTiles(createEmptyBoard())
  }

  // Save edited move
  const handleSaveEdit = () => {
    if (editingMoveIndex === null) return

    const move = boardStateToMove(newTiles)
    const boardForValidation = getBoardExcludingMove(moves, editingMoveIndex)

    if (move.length > 0) {
      const validation = validateMove(move, boardForValidation, isFirstMove)
      if (!validation.valid) {
        toast.error(validation.error)
        return
      }
    }

    updateMove(editingMoveIndex, move)
    setEditingMoveIndex(null)
    setNewTiles(createEmptyBoard())
  }

  // End the current turn - validates and commits the move, or shows pass confirmation
  const handleEndTurn = () => {
    // If editing, save instead
    if (isEditing) {
      handleSaveEdit()
      return
    }

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

  const remainingTileCount = getRemainingTileCount(currentGame)

  const handleEndGameClick = () => {
    const playerCount = currentGame?.players.length ?? 2
    const threshold = (playerCount - 1) * 7

    if (remainingTileCount === 0) {
      // No tiles left, just end the game
      endGame()
      onEndGame()
    } else if (remainingTileCount <= threshold) {
      // Near end - show EndGameScreen for rack entry and adjustments
      stopTimer()
      setShowEndGameScreen(true)
    } else {
      // Early end - simple confirmation dialog
      setShowEndGameConfirm(true)
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
        {/* Edit mode banner */}
        {isEditing && <div className="font-bold px-3 py-1 text-center text-sm ">Editing move</div>}

        {/* Board area */}
        <div className="flex flex-col items-center w-full">
          <ScrabbleBoard
            tiles={displayBoard}
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
            const moveHistory = getPlayerMoveHistory(moves, index)

            const handlePlayerClick = () => {
              // Only current player or next player can be clicked to end turn
              if (!isActive && index !== (currentPlayerIndex + 1) % players.length) return
              handleEndTurn()
            }

            return (
              <div
                key={index}
                role="region"
                aria-label={`${player.name}'s score panel`}
                aria-current={isActive ? 'true' : undefined}
                data-player={player.name}
                className="flex min-w-32 flex-1 flex-col overflow-hidden rounded-lg"
                style={{
                  boxShadow: isActive ? `0 0 0 3px ${player.color}` : `0 0 0 1px ${player.color}40`,
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
                  <Timer
                    timeRemainingMs={player.timeRemainingMs}
                    color={player.color}
                    isActive={isActive}
                    isPaused={!timerRunning}
                  />

                  {/* Player name and score */}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{player.name}</span>
                    <span className="text-2xl font-bold">{score}</span>
                  </div>
                </div>

                {/* Move history for this player */}
                <MoveHistoryList
                  history={moveHistory}
                  onMoveClick={highlightTiles}
                  onMoveLongPress={playerMoveIndex => handleEditMove(index, playerMoveIndex)}
                  editingIndex={editingMoveInfo?.playerIndex === index ? editingMoveInfo.playerMoveIndex : undefined}
                  className="p-2 text-[10px] [&_span:first-child]:font-mono"
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center gap-2 border-t bg-white p-2">
        {isEditing ? (
          <>
            <Button variant="outline" size="xs" onClick={handleCancelEdit}>
              <IconX size={14} />
              Cancel
            </Button>
            <Button variant="default" size="xs" onClick={handleSaveEdit}>
              Save edit
            </Button>
          </>
        ) : (
          <>
            <Button variant={timerRunning ? 'outline' : 'default'} size="xs" onClick={handleTimerToggle}>
              {timerRunning ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />}
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
          </>
        )}
      </div>

      {/* Pass confirmation dialog */}
      <ConfirmDialog
        open={showPassConfirm}
        onOpenChange={setShowPassConfirm}
        title="Pass turn?"
        description={`${players[currentPlayerIndex].name} has not placed any tiles. Are you sure you want to pass this turn?`}
        confirmText="Pass"
        onConfirm={handleConfirmPass}
      />

      {/* End game confirmation dialog */}
      <ConfirmDialog
        open={showEndGameConfirm}
        onOpenChange={setShowEndGameConfirm}
        title="End game?"
        description={`There are still ${remainingTileCount} unplayed tiles. Are you sure you want to end the game?`}
        confirmText="End game"
        onConfirm={handleConfirmEndGame}
      />

      {/* Tile overuse confirmation dialog */}
      <ConfirmDialog
        open={tileOveruseConfirm !== null}
        onOpenChange={open => !open && setTileOveruseConfirm(null)}
        title="Too many tiles used"
        description={
          tileOveruseConfirm && (
            <div className="text-left">
              This move uses more tiles than exist in the game:
              <ul className="mt-2 list-disc pl-5">
                {tileOveruseConfirm.warnings.map((w, i) => (
                  <li key={i}>
                    <strong>{w.tile}</strong>: {w.used} used, but only {w.available} exist
                  </li>
                ))}
              </ul>
              <p className="mt-2">Do you want to play this move anyway?</p>
            </div>
          )
        }
        secondaryText="Play anyway"
        onSecondary={handleConfirmTileOveruse}
        secondaryClassName="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
        confirmText="Fix move"
        onConfirm={() => setTileOveruseConfirm(null)}
      />
    </div>
  )
}

type Props = {
  gameUrl: AutomergeUrl
  onEndGame: () => void
}
