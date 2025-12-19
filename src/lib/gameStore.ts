import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Game, GameSummary, PlayerRecord, BoardState, GameMove, Player } from './types'
import { createEmptyBoard, createPlayer } from './types'
import { calculateMoveScore } from './calculateMoveScore'

/** Calculate a player's total score from all their moves */
export const getPlayerScore = (game: Game, playerIndex: number): number => {
  let score = 0
  let boardState = createEmptyBoard()

  for (const move of game.moves) {
    if (move.playerIndex === playerIndex) {
      score += calculateMoveScore({ move: move.tilesPlaced, board: boardState })
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
  pastGames: GameSummary[]
  playerRecords: PlayerRecord[]

  // ACTIONS

  // Game lifecycle
  startGame: (playerNames: string[]) => void
  endGame: () => void
  pauseGame: () => void
  resumeGame: () => void

  // Gameplay
  recordMove: (move: GameMove) => void
  updateBoard: (board: BoardState) => void
  nextTurn: () => void
  commitMove: (move: GameMove) => void
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

        // Calculate scores from moves
        const playerScores = currentGame.players.map((_, index) => getPlayerScore(currentGame, index))
        const maxScore = Math.max(...playerScores)

        // Create game summary
        const summary: GameSummary = {
          date: currentGame.createdAt,
          players: currentGame.players.map((p, index) => ({
            name: p.name,
            score: playerScores[index],
            isWinner: playerScores[index] === maxScore,
          })),
        }

        set({
          currentGame: { ...currentGame, status: 'finished' },
          pastGames: [summary, ...pastGames],
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
      partialize: state => ({
        pastGames: state.pastGames,
        playerRecords: state.playerRecords,
        // Don't persist currentGame - it will be managed by Automerge later
      }),
    }
  )
)
