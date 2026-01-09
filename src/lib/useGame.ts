import { useState, useEffect } from 'react'
import { useDocument, useDocHandle } from '@automerge/automerge-repo-react-hooks'
import type { DocumentId } from '@automerge/automerge-repo'
import type { GameDoc, GameMoveDoc, TimerEventDoc } from './automergeTypes'
import type { BoardState, Game, GameMove, Move, Adjustment, TimerEvent } from './types'

/** Convert automerge board (empty strings) to app board (nulls) */
const toAppBoard = (board: string[][]): BoardState => {
  return board.map(row => row.map(cell => (cell === '' ? null : cell)))
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
      adjustment: m.adjustment
        ? {
            rackTiles: [...m.adjustment.rackTiles],
            deduction: m.adjustment.deduction,
            bonus: m.adjustment.bonus,
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
  undoLastMove: () => void
  removeMove: (moveIndex: number) => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  endGameWithAdjustments: (adjustments: Array<{ playerIndex: number } & Adjustment>) => void
}

/** Helper to check if timer is currently running based on events */
const isTimerRunning = (events: TimerEventDoc[] | undefined): boolean => {
  if (!events || events.length === 0) return false
  const lastEvent = events[events.length - 1]
  return lastEvent.type !== 'pause'
}

/** Helper to get the active player index from timer events */
const getActivePlayerIndex = (events: TimerEventDoc[] | undefined): number | null => {
  if (!events || events.length === 0) return null
  const lastEvent = events[events.length - 1]
  if (lastEvent.type === 'pause') return null
  return lastEvent.playerIndex
}

export const useGame = (id: DocumentId | null): UseGameResult => {
  const [doc, changeDoc] = useDocument<GameDoc>(id ?? undefined)
  const handle = useDocHandle<GameDoc>(id ?? undefined)

  // Track handle state changes to detect unavailable documents
  const [handleState, setHandleState] = useState<string | null>(null)

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
      if (handle.state === 'ready' || handle.state === 'unavailable' || handle.state === 'deleted') {
        clearInterval(pollInterval)
      }
    }, 100)

    return () => {
      clearInterval(pollInterval)
    }
  }, [handle])

  const commitMove = (move: GameMove) => {
    if (!doc) return
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

      // Advance turn
      const nextPlayerIndex = (d.currentPlayerIndex + 1) % d.players.length
      d.currentPlayerIndex = nextPlayerIndex

      // If timer is running, switch it to the next player
      if (isTimerRunning(d.timerEvents)) {
        if (!d.timerEvents) d.timerEvents = []
        d.timerEvents.push({
          type: 'switch',
          timestamp: Date.now(),
          playerIndex: nextPlayerIndex,
        })
      }

      d.updatedAt = Date.now()
    })
  }

  const updateMove = (moveIndex: number, newTiles: Move) => {
    if (!doc) return
    if (moveIndex < 0 || moveIndex >= doc.moves.length) return

    changeDoc(d => {
      // Update the move's tiles
      d.moves[moveIndex].tilesPlaced = newTiles.map(t => ({
        row: t.row,
        col: t.col,
        tile: t.tile,
      }))

      // Rebuild board from scratch
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          d.board[r][c] = ''
        }
      }
      for (const move of d.moves) {
        for (const { row, col, tile } of move.tilesPlaced) {
          d.board[row][col] = tile
        }
      }
      d.updatedAt = Date.now()
    })
  }

  const undoLastMove = () => {
    if (!doc || doc.moves.length === 0) return
    removeMove(doc.moves.length - 1)
  }

  const removeMove = (moveIndex: number) => {
    if (!doc) return
    if (moveIndex < 0 || moveIndex >= doc.moves.length) return

    changeDoc(d => {
      // Get the move being removed to determine whose turn it was
      const removedMove = d.moves[moveIndex]

      // Remove the move
      d.moves.splice(moveIndex, 1)

      // Rebuild board from scratch
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          d.board[r][c] = ''
        }
      }
      for (const move of d.moves) {
        for (const { row, col, tile } of move.tilesPlaced) {
          d.board[row][col] = tile
        }
      }

      // Set current player back to the player whose move was removed
      d.currentPlayerIndex = removedMove.playerIndex

      // If timer is running, switch it back to that player
      if (isTimerRunning(d.timerEvents)) {
        if (!d.timerEvents) d.timerEvents = []
        d.timerEvents.push({
          type: 'switch',
          timestamp: Date.now(),
          playerIndex: removedMove.playerIndex,
        })
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
          type: 'pause',
          timestamp: Date.now(),
          playerIndex: d.currentPlayerIndex,
        })
      }
      d.status = 'paused'
      d.updatedAt = Date.now()
    })
  }

  const resumeGame = () => {
    if (!doc) return
    changeDoc(d => {
      d.status = 'playing'
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
          type: 'pause',
          timestamp: Date.now(),
          playerIndex: d.currentPlayerIndex,
        })
      }
      d.status = 'finished'
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
          type: 'pause',
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
      d.status = 'finished'
      d.updatedAt = Date.now()
    })
  }

  const startTimer = () => {
    if (!doc) return
    changeDoc(d => {
      if (!d.timerEvents) d.timerEvents = []
      d.timerEvents.push({
        type: 'start',
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
          type: 'pause',
          timestamp: Date.now(),
          playerIndex: getActivePlayerIndex(d.timerEvents) ?? d.currentPlayerIndex,
        })
        d.updatedAt = Date.now()
      }
    })
  }

  // Document is loading if we have an ID but no doc yet, and handle isn't in a terminal state
  const isUnavailable = handleState === 'unavailable'
  const isLoading = id !== null && doc === undefined && !isUnavailable

  return {
    game: doc ? toAppGame(doc) : null,
    isLoading,
    isUnavailable,
    startTimer,
    stopTimer,
    commitMove,
    updateMove,
    undoLastMove,
    removeMove,
    pauseGame,
    resumeGame,
    endGame,
    endGameWithAdjustments,
  }
}
