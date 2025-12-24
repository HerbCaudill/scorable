import { useDocument } from '@automerge/automerge-repo-react-hooks'
import type { AutomergeUrl } from '@automerge/automerge-repo'
import type { GameDoc, GameMoveDoc } from './automergeTypes'
import { useLocalStore } from './localStore'
import type { BoardState, Game, GameMove, Move, Adjustment } from './types'

/** Convert automerge board (empty strings) to app board (nulls) */
const toAppBoard = (board: string[][]): BoardState => {
  return board.map(row => row.map(cell => (cell === '' ? null : cell)))
}

/** Convert automerge game doc to app Game type */
const toAppGame = (doc: GameDoc, timerRunning: boolean): Game => {
  return {
    id: doc.id,
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
    status: doc.status,
    timerRunning,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export type UseGameResult = {
  game: Game | null
  isLoading: boolean

  // Timer state (ephemeral, not synced)
  timerRunning: boolean
  setTimerRunning: (running: boolean) => void
  startTimer: () => void
  stopTimer: () => void

  // Game actions
  commitMove: (move: GameMove) => void
  updateMove: (moveIndex: number, newTiles: Move) => void
  updatePlayerTime: (playerIndex: number, timeRemainingMs: number) => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  endGameWithAdjustments: (adjustments: Array<{ playerIndex: number } & Adjustment>) => void
}

export const useGame = (url: AutomergeUrl | null): UseGameResult => {
  const [doc, changeDoc] = useDocument<GameDoc>(url ?? undefined)
  const { timerRunning, setTimerRunning } = useLocalStore()

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
      d.currentPlayerIndex = (d.currentPlayerIndex + 1) % d.players.length
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

  const updatePlayerTime = (playerIndex: number, timeRemainingMs: number) => {
    if (!doc) return
    changeDoc(d => {
      d.players[playerIndex].timeRemainingMs = timeRemainingMs
      d.updatedAt = Date.now()
    })
  }

  const pauseGame = () => {
    setTimerRunning(false)
    if (!doc) return
    changeDoc(d => {
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
    setTimerRunning(false)
    if (!doc) return
    changeDoc(d => {
      d.status = 'finished'
      d.updatedAt = Date.now()
    })
  }

  const endGameWithAdjustments = (adjustments: Array<{ playerIndex: number } & Adjustment>) => {
    setTimerRunning(false)
    if (!doc) return
    changeDoc(d => {
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

  const startTimer = () => setTimerRunning(true)
  const stopTimer = () => setTimerRunning(false)

  return {
    game: doc ? toAppGame(doc, timerRunning) : null,
    isLoading: url !== null && doc === undefined,
    timerRunning,
    setTimerRunning,
    startTimer,
    stopTimer,
    commitMove,
    updateMove,
    updatePlayerTime,
    pauseGame,
    resumeGame,
    endGame,
    endGameWithAdjustments,
  }
}
