import { useState, useEffect, useCallback } from "react"
import type { DocumentId } from "@automerge/automerge-repo"
import { useGame } from "@/lib/useGame"
import { getPlayerScore } from "@/lib/getPlayerScore"
import ScrabbleBoard from "./ScrabbleBoard"
import { Button } from "@/components/ui/button"
import { createEmptyBoard, computeTimerState, type BoardState, type GameMove } from "@/lib/types"
import { validateMove } from "@/lib/validateMove"
import { boardStateToMove } from "@/lib/boardStateToMove"
import { checkTileOveruse, type TileOveruseWarning } from "@/lib/checkTileOveruse"
import { getRemainingTileCount } from "@/lib/getRemainingTileCount"
import { getPlayerMoveHistory } from "@/lib/getPlayerMoveHistory"
import { UnplayedTilesScreen } from "./TileBagScreen"
import { EndGameScreen } from "./EndGameScreen"
import { ConfirmDialog } from "./ConfirmDialog"
import { MoveHistoryList, type MoveAction } from "./MoveHistoryList"
import { isValidWord, getWordDefinition } from "@/lib/wordList"
import { getWordsFromMove } from "@/lib/getWordsFromMove"
import { Timer } from "./Timer"
import { useHighlightedTiles } from "@/hooks/useHighlightedTiles"
import { toast } from "sonner"
import {
  IconFlag,
  IconCards,
  IconPlayerPause,
  IconPlayerPlay,
  IconX,
  IconShare,
} from "@tabler/icons-react"
import { MobileKeyboard } from "./MobileKeyboard"

/** Convert player's move index to global index in moves array */
const getGlobalMoveIndex = (
  moves: GameMove[],
  playerIndex: number,
  playerMoveIndex: number,
): number => {
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
  globalIndex: number,
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
const moveToBoardState = (tilesPlaced: GameMove["tilesPlaced"]): BoardState => {
  const board = createEmptyBoard()
  for (const { row, col, tile } of tilesPlaced) {
    board[row][col] = tile
  }
  return board
}

export const GameScreen = ({ gameId, onEndGame }: Props) => {
  const {
    game: currentGame,
    isLoading,
    isUnavailable,
    startTimer,
    stopTimer,
    commitMove,
    updateMove,
    undoLastMove,
    challengeMove,
    endGame,
    endGameWithAdjustments,
  } = useGame(gameId)

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

  // Mobile keyboard support
  const [isMobile] = useState(() => "ontouchstart" in window || navigator.maxTouchPoints > 0)
  const [keyHandler, setKeyHandler] = useState<((key: string) => void) | null>(null)
  const [hasCursor, setHasCursor] = useState(false)
  const [cursorDirection, setCursorDirection] = useState<"horizontal" | "vertical">("horizontal")

  // Stable callbacks for ScrabbleBoard to avoid infinite re-render loops
  const handleKeyPressCallback = useCallback((handler: (key: string) => void) => {
    setKeyHandler(() => handler)
  }, [])

  const handleCursorChangeCallback = useCallback(
    (cursor: boolean, direction: "horizontal" | "vertical") => {
      setHasCursor(cursor)
      setCursorDirection(direction)
    },
    [],
  )

  // Force re-render every 100ms to update timer display when running
  const [, setTick] = useState(0)
  const currentPlayerIndex = currentGame?.currentPlayerIndex ?? 0

  // Compute timer state from events (called on each render when timer running)
  const timerState =
    currentGame ?
      computeTimerState(currentGame.timerEvents, currentGame.players.length)
    : { timeRemaining: [], activePlayerIndex: null, isRunning: false }

  const timerRunning = timerState.isRunning
  const timerEverUsed = currentGame ? currentGame.timerEvents.length > 0 : false

  // Trigger re-renders when timer is running to update display
  useEffect(() => {
    if (!timerRunning) return

    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 100)

    return () => clearInterval(interval)
  }, [timerRunning])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading game...</div>
      </div>
    )
  }

  if (isUnavailable || !currentGame) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="text-gray-500">Game not found</div>
        <Button variant="outline" onClick={onEndGame}>
          Go home
        </Button>
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
  const editingMoveInfo =
    editingMoveIndex !== null ? getPlayerMoveIndex(moves, editingMoveIndex) : null

  // Board to display: when editing, exclude the move being edited
  const displayBoard = isEditing ? getBoardExcludingMove(moves, editingMoveIndex) : board

  // For validation: first move = no tiles placed before this point
  const isFirstMove =
    isEditing ?
      !moves.slice(0, editingMoveIndex).some(m => m.tilesPlaced.length > 0)
    : board.every(row => row.every(cell => cell === null))

  // Handle entering edit mode
  const handleEditMove = (playerIndex: number, playerMoveIndex: number) => {
    // Block if tiles are in progress
    const hasTilesInProgress = newTiles.some(row => row.some(cell => cell !== null))
    if (hasTilesInProgress) {
      toast.error("Clear current move first")
      return
    }

    const globalIndex = getGlobalMoveIndex(moves, playerIndex, playerMoveIndex)
    if (globalIndex === -1) return

    setEditingMoveIndex(globalIndex)
    setNewTiles(moveToBoardState(moves[globalIndex].tilesPlaced))
  }

  // Handle move actions from dropdown menu
  const handleMoveAction = (playerIndex: number, playerMoveIndex: number, action: MoveAction) => {
    const globalIndex = getGlobalMoveIndex(moves, playerIndex, playerMoveIndex)
    if (globalIndex === -1) return

    // Block if tiles are in progress
    const hasTilesInProgress = newTiles.some(row => row.some(cell => cell !== null))
    if (hasTilesInProgress) {
      toast.error("Clear current move first")
      return
    }

    switch (action) {
      case "correct":
        handleEditMove(playerIndex, playerMoveIndex)
        break

      case "undo":
        // Only allow undo of the last move
        if (globalIndex === moves.length - 1) {
          undoLastMove()
          toast.success("Move undone")
        } else {
          toast.error("Can only undo the most recent move")
        }
        break

      case "challenge": {
        // Only allow challenge of the last move
        if (globalIndex !== moves.length - 1) {
          toast.error("Can only challenge the most recent move")
          return
        }

        const move = moves[globalIndex]
        // Build board state before this move to check words
        const boardBeforeMove = getBoardExcludingMove(moves, globalIndex)
        const words = getWordsFromMove(move.tilesPlaced, boardBeforeMove)

        // Check each word against the dictionary
        const invalidWords = words.filter(word => !isValidWord(word))

        if (invalidWords.length > 0) {
          // Challenge successful - remove the move, challenged player passes
          challengeMove(globalIndex, true)
          const invalidList = invalidWords.map(w => w.toUpperCase()).join(", ")
          toast.error(`${invalidList} ${invalidWords.length > 1 ? "are" : "is"} not valid`)
        } else {
          // Challenge failed - challenger loses their turn, record the challenged words
          challengeMove(globalIndex, false, words)
          toast.success(
            <div>
              <div className="font-medium">All words are valid:</div>
              <ul className="mt-1 list-disc pl-4">
                {words.map(word => {
                  const entry = getWordDefinition(word)
                  const def = entry?.definitions[0]?.text ?? "no definition"
                  return (
                    <li key={word}>
                      <strong>{word.toUpperCase()}</strong>: {def}
                    </li>
                  )
                })}
              </ul>
            </div>,
          )
        }
        break
      }
    }
  }

  // Check if a player's move at index is the last move in the game
  const isLastMoveForPlayer = (playerIndex: number, playerMoveIndex: number): boolean => {
    const globalIndex = getGlobalMoveIndex(moves, playerIndex, playerMoveIndex)
    return globalIndex === moves.length - 1
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
    stopTimer()
    setShowEndGameScreen(true)
  }

  const handleTimerToggle = () => {
    if (timerRunning) stopTimer()
    else startTimer()
  }

  const handleShare = async () => {
    const url = window.location.href

    // Use native share only on mobile (iOS/Android), not on macOS
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile && navigator.share) {
      try {
        await navigator.share({ url })
      } catch {
        // User cancelled or share failed - ignore
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    }
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
    <div className="flex h-dvh flex-col gap-3 overflow-hidden p-2">
      {/*  Board + Player panels */}
      <div className="shrink-0">
        {/* Edit mode banner */}
        {isEditing && <div className="font-bold text-center text-sm">Editing move</div>}

        {/* Board area */}
        <div className="flex flex-col items-center w-full">
          <ScrabbleBoard
            tiles={displayBoard}
            newTiles={newTiles}
            onNewTilesChange={setNewTiles}
            editable
            highlightedTiles={highlightedTiles}
            onEnter={handleEndTurn}
            onKeyPress={handleKeyPressCallback}
            onCursorChange={handleCursorChangeCallback}
          />
        </div>
      </div>

      {/* Player panels + history - scroll together horizontally, each panel scrolls vertically */}
      <div className="min-h-0 flex-1 overflow-x-auto -mx-2 px-2 py-1">
        <div className="flex h-full w-full gap-3">
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
                aria-current={isActive ? "true" : undefined}
                data-player={player.name}
                className="flex min-h-0 min-w-40 flex-1 flex-col rounded-lg bg-white"
                style={{
                  boxShadow: isActive ? `0 0 0 3px ${player.color}` : `0 0 0 1px ${player.color}40`,
                }}
              >
                {/* Player panel header */}
                <div
                  className="shrink-0 flex cursor-pointer items-center gap-3 p-2 transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: isActive ? `${player.color}20` : "transparent",
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? player.color : `${player.color}20`,
                  }}
                  onClick={handlePlayerClick}
                >
                  {timerEverUsed && (
                    <Timer
                      timeRemainingMs={timerState.timeRemaining[index] ?? player.timeRemainingMs}
                      color={player.color}
                      isActive={isActive}
                      isPaused={!timerRunning}
                    />
                  )}

                  {/* Player name and score */}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{player.name}</span>
                    <span className="text-2xl font-bold">{score}</span>
                  </div>
                </div>

                {/* Move history for this player - scrolls independently */}
                <MoveHistoryList
                  history={moveHistory}
                  onMoveClick={highlightTiles}
                  onMoveAction={(playerMoveIndex, action) =>
                    handleMoveAction(index, playerMoveIndex, action)
                  }
                  editingIndex={
                    editingMoveInfo?.playerIndex === index ?
                      editingMoveInfo.playerMoveIndex
                    : undefined
                  }
                  isLastMove={playerMoveIndex => isLastMoveForPlayer(index, playerMoveIndex)}
                  className="min-h-0 flex-1 overflow-y-auto p-1 text-[10px] [&_span:first-child]:font-mono"
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Action buttons - placed below player panels to avoid mobile browser overlap */}
      <div className="shrink-0 flex gap-2 relative z-60">
        {isEditing ?
          <>
            <Button className="flex-1" variant="outline" size="xs" onClick={handleCancelEdit}>
              <IconX size={14} />
              Cancel
            </Button>
            <Button className="flex-1" variant="default" size="xs" onClick={handleSaveEdit}>
              Save edit
            </Button>
          </>
        : <>
            {timerEverUsed ?
              <Button
                className="flex-1"
                variant={timerRunning ? "outline" : "default"}
                size="xs"
                onClick={handleTimerToggle}
              >
                {timerRunning ?
                  <IconPlayerPause size={14} />
                : <IconPlayerPlay size={14} />}
                {timerRunning ? "Pause" : "Resume"}
              </Button>
            : <Button className="flex-1" variant="outline" size="xs" onClick={handleTimerToggle}>
                <IconPlayerPlay size={14} />
                Timer
              </Button>
            }
            <Button
              className="flex-1"
              variant="outline"
              size="xs"
              onClick={() => setShowTileBag(true)}
            >
              <IconCards size={14} />
              Tiles ({remainingTileCount})
            </Button>
            <Button className="flex-1" variant="outline" size="xs" onClick={handleEndGameClick}>
              <IconFlag size={14} />
              End game
            </Button>
            <Button className="flex-1" variant="outline" size="xs" onClick={handleShare}>
              <IconShare size={14} />
              Share
            </Button>
          </>
        }
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

      {/* Mobile keyboard - floating overlay */}
      {isMobile && keyHandler && (
        <MobileKeyboard onKeyPress={keyHandler} direction={cursorDirection} visible={hasCursor} />
      )}
    </div>
  )
}

type Props = {
  gameId: DocumentId
  onEndGame: () => void
}
