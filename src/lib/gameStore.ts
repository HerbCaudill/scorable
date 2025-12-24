import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Game, PlayerRecord, BoardState, GameMove, Player, Adjustment, Move } from './types'
import { createEmptyBoard, createPlayer } from './types'
import { calculateMoveScore } from './calculateMoveScore'

/** Calculate a player's total score from all their moves */
export const getPlayerScore = (game: Game, playerIndex: number): number => {
  let score = 0
  let boardState = createEmptyBoard()

  for (const move of game.moves) {
    if (move.playerIndex === playerIndex) {
      // Add regular move score
      score += calculateMoveScore({ move: move.tilesPlaced, board: boardState })

      // Add end-game adjustment if present
      if (move.adjustment) {
        score += move.adjustment.deduction + move.adjustment.bonus
      }
    }
    // Update board state after each move
    for (const { row, col, tile } of move.tilesPlaced) {
      boardState[row][col] = tile
    }
  }

  return score
}

type GameStore = {
  // Current game state
  currentGame: Game | null

  // Historical data
  pastGames: Game[]
  playerRecords: PlayerRecord[]

  // ACTIONS

  // Game lifecycle
  startGame: (playerNames: string[]) => void
  endGame: () => void
  endGameWithAdjustments: (adjustments: Array<{ playerIndex: number } & Adjustment>) => void
  pauseGame: () => void
  resumeGame: () => void

  // Gameplay
  recordMove: (move: GameMove) => void
  updateBoard: (board: BoardState) => void
  nextTurn: () => void
  commitMove: (move: GameMove) => void
  updateMove: (moveIndex: number, newTiles: Move) => void
  updatePlayerTime: (playerIndex: number, timeRemainingMs: number) => void

  // Timer
  startTimer: () => void
  stopTimer: () => void

  // Player records
  addPlayerRecord: (name: string) => void
  getPlayerNames: () => string[]
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentGame: null,
      pastGames: [],
      playerRecords: [],

      startGame: (playerNames: string[]) => {
        const players: Player[] = playerNames.map((name, index) => createPlayer(name, index))

        // Update player records
        const { addPlayerRecord } = get()
        for (const name of playerNames) {
          addPlayerRecord(name)
        }

        const game: Game = {
          id: crypto.randomUUID(),
          players,
          currentPlayerIndex: 0,
          board: createEmptyBoard(),
          moves: [],
          status: 'playing',
          timerRunning: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set({ currentGame: game })
      },

      endGame: () => {
        const { currentGame, pastGames } = get()
        if (!currentGame) return

        const finishedGame: Game = {
          ...currentGame,
          status: 'finished',
          updatedAt: Date.now(),
        }

        set({
          currentGame: finishedGame,
          pastGames: [finishedGame, ...pastGames],
        })
      },

      endGameWithAdjustments: adjustments => {
        const { currentGame, pastGames } = get()
        if (!currentGame) return

        // Create adjustment moves for each player
        const adjustmentMoves: GameMove[] = adjustments.map(adj => ({
          playerIndex: adj.playerIndex,
          tilesPlaced: [],
          adjustment: {
            rackTiles: adj.rackTiles,
            deduction: adj.deduction,
            bonus: adj.bonus,
          },
        }))

        const finishedGame: Game = {
          ...currentGame,
          moves: [...currentGame.moves, ...adjustmentMoves],
          status: 'finished',
          timerRunning: false,
          updatedAt: Date.now(),
        }

        set({
          currentGame: finishedGame,
          pastGames: [finishedGame, ...pastGames],
        })
      },

      pauseGame: () => {
        const { currentGame } = get()
        if (!currentGame || currentGame.status !== 'playing') return

        set({
          currentGame: {
            ...currentGame,
            status: 'paused',
            timerRunning: false,
            updatedAt: Date.now(),
          },
        })
      },

      resumeGame: () => {
        const { currentGame } = get()
        if (!currentGame || currentGame.status !== 'paused') return

        set({
          currentGame: {
            ...currentGame,
            status: 'playing',
            updatedAt: Date.now(),
          },
        })
      },

      recordMove: move => {
        const { currentGame } = get()
        if (!currentGame) return

        const newMove: GameMove = {
          ...move,
        }

        set({
          currentGame: {
            ...currentGame,
            moves: [...currentGame.moves, newMove],
            updatedAt: Date.now(),
          },
        })
      },

      updateBoard: board => {
        const { currentGame } = get()
        if (!currentGame) return

        set({
          currentGame: {
            ...currentGame,
            board,
            updatedAt: Date.now(),
          },
        })
      },

      nextTurn: () => {
        const { currentGame } = get()
        if (!currentGame) return

        const nextPlayerIndex = (currentGame.currentPlayerIndex + 1) % currentGame.players.length

        set({
          currentGame: {
            ...currentGame,
            currentPlayerIndex: nextPlayerIndex,
            updatedAt: Date.now(),
          },
        })
      },

      commitMove: move => {
        const { currentGame } = get()
        if (!currentGame) return

        // Record move to history
        const newMoves = [...currentGame.moves, move]

        // Merge tiles into board
        const newBoard = currentGame.board.map(r => [...r])
        for (const { row, col, tile } of move.tilesPlaced) {
          newBoard[row][col] = tile
        }

        // Advance turn
        const nextPlayerIndex = (currentGame.currentPlayerIndex + 1) % currentGame.players.length

        set({
          currentGame: {
            ...currentGame,
            moves: newMoves,
            board: newBoard,
            currentPlayerIndex: nextPlayerIndex,
            updatedAt: Date.now(),
          },
        })
      },

      updateMove: (moveIndex, newTiles) => {
        const { currentGame } = get()
        if (!currentGame) return
        if (moveIndex < 0 || moveIndex >= currentGame.moves.length) return

        // Update the move's tiles
        const newMoves = [...currentGame.moves]
        newMoves[moveIndex] = {
          ...newMoves[moveIndex],
          tilesPlaced: newTiles,
        }

        // Rebuild board from scratch by replaying all moves
        const newBoard = createEmptyBoard()
        for (const move of newMoves) {
          for (const { row, col, tile } of move.tilesPlaced) {
            newBoard[row][col] = tile
          }
        }

        set({
          currentGame: {
            ...currentGame,
            moves: newMoves,
            board: newBoard,
            updatedAt: Date.now(),
          },
        })
      },

      updatePlayerTime: (playerIndex, timeRemainingMs) => {
        const { currentGame } = get()
        if (!currentGame) return

        const updatedPlayers = [...currentGame.players]
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          timeRemainingMs,
        }

        set({
          currentGame: {
            ...currentGame,
            players: updatedPlayers,
            updatedAt: Date.now(),
          },
        })
      },

      startTimer: () => {
        const { currentGame } = get()
        if (!currentGame) return

        set({
          currentGame: {
            ...currentGame,
            timerRunning: true,
            updatedAt: Date.now(),
          },
        })
      },

      stopTimer: () => {
        const { currentGame } = get()
        if (!currentGame) return

        set({
          currentGame: {
            ...currentGame,
            timerRunning: false,
            updatedAt: Date.now(),
          },
        })
      },

      addPlayerRecord: name => {
        const { playerRecords } = get()
        const existingIndex = playerRecords.findIndex(r => r.name.toLowerCase() === name.toLowerCase())

        if (existingIndex >= 0) {
          // Update existing record
          const updated = [...playerRecords]
          updated[existingIndex] = {
            ...updated[existingIndex],
            gamesPlayed: updated[existingIndex].gamesPlayed + 1,
            lastPlayedAt: Date.now(),
          }
          set({ playerRecords: updated })
        } else {
          // Add new record
          set({
            playerRecords: [
              ...playerRecords,
              {
                name,
                gamesPlayed: 1,
                lastPlayedAt: Date.now(),
              },
            ],
          })
        }
      },

      getPlayerNames: () => {
        const { playerRecords } = get()
        // Sort by games played (descending), then by last played (descending)
        return [...playerRecords]
          .sort((a, b) => {
            if (b.gamesPlayed !== a.gamesPlayed) {
              return b.gamesPlayed - a.gamesPlayed
            }
            return b.lastPlayedAt - a.lastPlayedAt
          })
          .map(r => r.name)
      },
    }),
    {
      name: 'scrabble-game-storage',
      version: 2,
      partialize: state => ({
        currentGame: state.currentGame,
        pastGames: state.pastGames,
        playerRecords: state.playerRecords,
      }),
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<GameStore>
        if (version < 2) {
          // Discard old GameSummary[] format, keep only playerRecords
          return {
            currentGame: null,
            pastGames: [],
            playerRecords: state.playerRecords ?? [],
          }
        }
        return state as GameStore
      },
    }
  )
)
