import { useState, useEffect, useCallback, useRef } from "react"
import { useDocument, useDocHandle } from "@automerge/automerge-repo-react-hooks"
import type { DocumentId } from "@automerge/automerge-repo"
import type { GameDoc, GameMoveDoc, TimerEventDoc } from "./automergeTypes"
import type { BoardState, Game, GameMove, Move, Adjustment, TimerEvent } from "./types"

/** Snapshot of undoable game state */
type GameSnapshot = {
  moves: GameMoveDoc[]
  currentPlayerIndex: number
  timerEventsLength: number // Only track length since we append timer events
}

/** Clear board and rebuild from moves */
function rebuildBoard(board: string[][], moves: GameMoveDoc[]): void {
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      board[r][c] = ""
    }
  }
  for (const move of moves) {
    for (const { row, col, tile } of move.tilesPlaced) {
      board[row][col] = tile
    }
  }
}

/** Add timer switch event if timer is running (mutates the events array) */
function addTimerSwitchEvent(d: { timerEvents?: TimerEventDoc[] }, playerIndex: number): void {
  if (!isTimerRunning(d.timerEvents)) return
  if (!d.timerEvents) d.timerEvents = []
  d.timerEvents.push({
    type: "switch",
    timestamp: Date.now(),
    playerIndex,
  })
}

/** Convert automerge board (empty strings) to app board (nulls) */
const toAppBoard = (board: string[][]): BoardState => {
  return board.map(row => row.map(cell => (cell === "" ? null : cell)))
}

/** Convert automerge timer events to app timer events */
const toAppTimerEvents = (events: TimerEventDoc[] | undefined): TimerEvent[] => {
  if (!events) return []
  return events.map(e => ({
    type: e.type,
    timestamp: e.timestamp,
    playerIndex: e.playerIndex,
  }))
}

/** Convert automerge game doc to app Game type */
const toAppGame = (doc: GameDoc): Game => {
  return {
    players: doc.players.map(p => ({
      name: p.name,
      timeRemainingMs: p.timeRemainingMs,
      color: p.color,
    })),
    currentPlayerIndex: doc.currentPlayerIndex,
    board: toAppBoard(doc.board),
    moves: doc.moves.map(m => ({
      playerIndex: m.playerIndex,
      tilesPlaced: m.tilesPlaced.map(t => ({
        row: t.row,
        col: t.col,
        tile: t.tile,
      })),
      adjustment:
        m.adjustment ?
          {
            rackTiles: [...m.adjustment.rackTiles],
            deduction: m.adjustment.deduction,
            bonus: m.adjustment.bonus,
          }
        : undefined,
      failedChallenge:
        m.failedChallenge ?
          {
            words: [...m.failedChallenge.words],
          }
        : undefined,
      successfulChallenge:
        m.successfulChallenge ?
          {
            words: [...m.successfulChallenge.words],
          }
        : undefined,
    })),
    timerEvents: toAppTimerEvents(doc.timerEvents),
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export type UseGameResult = {
  game: Game | null
  isLoading: boolean
  isUnavailable: boolean

  // Timer actions (synced via timer events)
  startTimer: () => void
  stopTimer: () => void

  // Game actions
  commitMove: (move: GameMove) => void
  updateMove: (moveIndex: number, newTiles: Move) => void
  removeMove: (moveIndex: number) => void
  /** Handle challenge result - successful removes move and skips challenged player's turn,
   *  failed skips challenger's turn and records the challenged words */
  challengeMove: (
    moveIndex: number,
    successful: boolean,
    challengedWords?: string[],
    invalidWords?: string[],
  ) => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  endGameWithAdjustments: (adjustments: Array<{ playerIndex: number } & Adjustment>) => void

  // Undo/Redo - generic undo/redo for any game action
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

/** Helper to check if timer is currently running based on events */
const isTimerRunning = (events: TimerEventDoc[] | undefined): boolean => {
  if (!events || events.length === 0) return false
  const lastEvent = events[events.length - 1]
  return lastEvent.type !== "pause"
}

/** Helper to get the active player index from timer events */
const getActivePlayerIndex = (events: TimerEventDoc[] | undefined): number | null => {
  if (!events || events.length === 0) return null
  const lastEvent = events[events.length - 1]
  if (lastEvent.type === "pause") return null
  return lastEvent.playerIndex
}

export const useGame = (id: DocumentId | null): UseGameResult => {
  const [doc, changeDoc] = useDocument<GameDoc>(id ?? undefined)
  const handle = useDocHandle<GameDoc>(id ?? undefined)

  // Track handle state changes to detect unavailable documents
  const [handleState, setHandleState] = useState<string | null>(null)

  // Undo/Redo stacks - stored locally (not synced)
  const undoStackRef = useRef<GameSnapshot[]>([])
  const redoStackRef = useRef<GameSnapshot[]>([])
  const [undoRedoVersion, setUndoRedoVersion] = useState(0)

  // Helper to create a snapshot of current state
  const createSnapshot = useCallback((): GameSnapshot | null => {
    if (!doc) return null
    return {
      moves: doc.moves.map(m => ({
        playerIndex: m.playerIndex,
        tilesPlaced: m.tilesPlaced.map(t => ({ row: t.row, col: t.col, tile: t.tile })),
        adjustment:
          m.adjustment ? { ...m.adjustment, rackTiles: [...m.adjustment.rackTiles] } : undefined,
      })),
      currentPlayerIndex: doc.currentPlayerIndex,
      timerEventsLength: doc.timerEvents?.length ?? 0,
    }
  }, [doc])

  // Helper to push snapshot to undo stack before an action
  const pushUndo = useCallback(() => {
    const snapshot = createSnapshot()
    if (snapshot) {
      undoStackRef.current = [...undoStackRef.current, snapshot]
      redoStackRef.current = [] // Clear redo stack on new action
      setUndoRedoVersion(v => v + 1)
    }
  }, [createSnapshot])

  useEffect(() => {
    if (!handle) {
      setHandleState(null)
      return
    }

    // Get initial state
    setHandleState(handle.state)

    // Poll handle state since 'change' event only fires on document content changes,
    // not on state transitions (e.g., to 'unavailable')
    const pollInterval = setInterval(() => {
      setHandleState(prevState => {
        if (handle.state !== prevState) {
          return handle.state
        }
        return prevState
      })
      // Stop polling once we reach a terminal state
      if (
        handle.state === "ready" ||
        handle.state === "unavailable" ||
        handle.state === "deleted"
      ) {
        clearInterval(pollInterval)
      }
    }, 100)

    return () => {
      clearInterval(pollInterval)
    }
  }, [handle])

  const commitMove = (move: GameMove) => {
    if (!doc) return
    pushUndo()
    changeDoc(d => {
      const moveDoc: GameMoveDoc = {
        playerIndex: move.playerIndex,
        tilesPlaced: move.tilesPlaced.map(t => ({
          row: t.row,
          col: t.col,
          tile: t.tile,
        })),
      }
      d.moves.push(moveDoc)

      // Update board
      for (const { row, col, tile } of move.tilesPlaced) {
        d.board[row][col] = tile
      }

      // Advance turn and switch timer
      const nextPlayerIndex = (d.currentPlayerIndex + 1) % d.players.length
      d.currentPlayerIndex = nextPlayerIndex
      addTimerSwitchEvent(d, nextPlayerIndex)
      d.updatedAt = Date.now()
    })
  }

  const updateMove = (moveIndex: number, newTiles: Move) => {
    if (!doc) return
    if (moveIndex < 0 || moveIndex >= doc.moves.length) return

    pushUndo()
    changeDoc(d => {
      d.moves[moveIndex].tilesPlaced = newTiles.map(t => ({
        row: t.row,
        col: t.col,
        tile: t.tile,
      }))
      rebuildBoard(d.board, d.moves)
      d.updatedAt = Date.now()
    })
  }

  const removeMove = (moveIndex: number) => {
    if (!doc) return
    if (moveIndex < 0 || moveIndex >= doc.moves.length) return

    pushUndo()
    changeDoc(d => {
      const removedMove = d.moves[moveIndex]
      d.moves.splice(moveIndex, 1)
      rebuildBoard(d.board, d.moves)

      // Restore turn to the player whose move was removed
      d.currentPlayerIndex = removedMove.playerIndex
      addTimerSwitchEvent(d, removedMove.playerIndex)
      d.updatedAt = Date.now()
    })
  }

  const challengeMove = (
    moveIndex: number,
    successful: boolean,
    challengedWords?: string[],
    invalidWords?: string[],
  ) => {
    if (!doc) return
    if (moveIndex < 0 || moveIndex >= doc.moves.length) return

    pushUndo()
    changeDoc(d => {
      const challengedMove = d.moves[moveIndex]
      const challengedPlayerIndex = challengedMove.playerIndex
      const playerCount = d.players.length

      if (successful) {
        // Challenge successful: remove the move, challenged player passes (loses turn)
        d.moves.splice(moveIndex, 1)
        rebuildBoard(d.board, d.moves)

        // Add a pass move for the challenged player with the rejected words recorded
        d.moves.push({
          playerIndex: challengedPlayerIndex,
          tilesPlaced: [],
          successfulChallenge: invalidWords ? { words: invalidWords } : undefined,
        })

        // Move to the next player after the challenged player
        const nextPlayerIndex = (challengedPlayerIndex + 1) % playerCount
        d.currentPlayerIndex = nextPlayerIndex
        addTimerSwitchEvent(d, nextPlayerIndex)
      } else {
        // Challenge failed: challenger (current player) loses their turn
        const challengerIndex = d.currentPlayerIndex
        d.moves.push({
          playerIndex: challengerIndex,
          tilesPlaced: [],
          failedChallenge: challengedWords ? { words: challengedWords } : undefined,
        })

        const nextPlayerIndex = (challengerIndex + 1) % playerCount
        d.currentPlayerIndex = nextPlayerIndex
        addTimerSwitchEvent(d, nextPlayerIndex)
      }

      d.updatedAt = Date.now()
    })
  }

  const pauseGame = () => {
    if (!doc) return
    changeDoc(d => {
      // Add pause timer event if timer is running
      if (isTimerRunning(d.timerEvents)) {
        if (!d.timerEvents) d.timerEvents = []
        d.timerEvents.push({
          type: "pause",
          timestamp: Date.now(),
          playerIndex: d.currentPlayerIndex,
        })
      }
      d.status = "paused"
      d.updatedAt = Date.now()
    })
  }

  const resumeGame = () => {
    if (!doc) return
    changeDoc(d => {
      d.status = "playing"
      d.updatedAt = Date.now()
    })
  }

  const endGame = () => {
    if (!doc) return
    changeDoc(d => {
      // Add pause timer event if timer is running
      if (isTimerRunning(d.timerEvents)) {
        if (!d.timerEvents) d.timerEvents = []
        d.timerEvents.push({
          type: "pause",
          timestamp: Date.now(),
          playerIndex: d.currentPlayerIndex,
        })
      }
      d.status = "finished"
      d.updatedAt = Date.now()
    })
  }

  const endGameWithAdjustments = (adjustments: Array<{ playerIndex: number } & Adjustment>) => {
    if (!doc) return
    changeDoc(d => {
      // Add pause timer event if timer is running
      if (isTimerRunning(d.timerEvents)) {
        if (!d.timerEvents) d.timerEvents = []
        d.timerEvents.push({
          type: "pause",
          timestamp: Date.now(),
          playerIndex: d.currentPlayerIndex,
        })
      }

      for (const adj of adjustments) {
        const moveDoc: GameMoveDoc = {
          playerIndex: adj.playerIndex,
          tilesPlaced: [],
          adjustment: {
            rackTiles: [...adj.rackTiles],
            deduction: adj.deduction,
            bonus: adj.bonus,
          },
        }
        d.moves.push(moveDoc)
      }
      d.status = "finished"
      d.updatedAt = Date.now()
    })
  }

  const startTimer = () => {
    if (!doc) return
    changeDoc(d => {
      if (!d.timerEvents) d.timerEvents = []
      d.timerEvents.push({
        type: "start",
        timestamp: Date.now(),
        playerIndex: d.currentPlayerIndex,
      })
      d.updatedAt = Date.now()
    })
  }

  const stopTimer = () => {
    if (!doc) return
    changeDoc(d => {
      if (isTimerRunning(d.timerEvents)) {
        if (!d.timerEvents) d.timerEvents = []
        d.timerEvents.push({
          type: "pause",
          timestamp: Date.now(),
          playerIndex: getActivePlayerIndex(d.timerEvents) ?? d.currentPlayerIndex,
        })
        d.updatedAt = Date.now()
      }
    })
  }

  // Document is loading if we have an ID but no doc yet, and handle isn't in a terminal state
  const isUnavailable = handleState === "unavailable"
  const isLoading = id !== null && doc === undefined && !isUnavailable

  /** Restore game state from a snapshot */
  const restoreSnapshot = useCallback(
    (snapshot: GameSnapshot) => {
      changeDoc(d => {
        // Restore moves - filter out undefined adjustment to avoid Automerge error
        const cleanMoves = snapshot.moves.map(m => {
          const move: typeof m = {
            playerIndex: m.playerIndex,
            tilesPlaced: m.tilesPlaced,
          }
          if (m.adjustment !== undefined) {
            move.adjustment = m.adjustment
          }
          return move
        })
        d.moves.splice(0, d.moves.length, ...cleanMoves)
        rebuildBoard(d.board, d.moves)
        d.currentPlayerIndex = snapshot.currentPlayerIndex

        // Trim timer events to snapshot length if needed
        if (d.timerEvents && d.timerEvents.length > snapshot.timerEventsLength) {
          d.timerEvents.splice(snapshot.timerEventsLength)
        }

        d.updatedAt = Date.now()
      })
    },
    [changeDoc],
  )

  // Undo: restore the previous snapshot
  const undo = useCallback(() => {
    if (!doc || undoStackRef.current.length === 0) return

    // Save current state to redo stack
    const currentSnapshot = createSnapshot()
    if (currentSnapshot) {
      redoStackRef.current = [...redoStackRef.current, currentSnapshot]
    }

    // Pop and restore from undo stack
    const snapshot = undoStackRef.current[undoStackRef.current.length - 1]
    undoStackRef.current = undoStackRef.current.slice(0, -1)
    restoreSnapshot(snapshot)
    setUndoRedoVersion(v => v + 1)
  }, [doc, createSnapshot, restoreSnapshot])

  // Redo: restore the next snapshot from redo stack
  const redo = useCallback(() => {
    if (!doc || redoStackRef.current.length === 0) return

    // Save current state to undo stack
    const currentSnapshot = createSnapshot()
    if (currentSnapshot) {
      undoStackRef.current = [...undoStackRef.current, currentSnapshot]
    }

    // Pop and restore from redo stack
    const snapshot = redoStackRef.current[redoStackRef.current.length - 1]
    redoStackRef.current = redoStackRef.current.slice(0, -1)
    restoreSnapshot(snapshot)
    setUndoRedoVersion(v => v + 1)
  }, [doc, createSnapshot, restoreSnapshot])

  // Track canUndo/canRedo based on stack state (undoRedoVersion triggers re-render)
  const canUndo = undoStackRef.current.length > 0
  const canRedo = redoStackRef.current.length > 0

  // Include undoRedoVersion in a way that doesn't cause ESLint warnings
  void undoRedoVersion

  return {
    game: doc ? toAppGame(doc) : null,
    isLoading,
    isUnavailable,
    startTimer,
    stopTimer,
    commitMove,
    updateMove,
    removeMove,
    challengeMove,
    pauseGame,
    resumeGame,
    endGame,
    endGameWithAdjustments,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
