import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Game, GameSummary, PlayerRecord, BoardState, Move, Player } from './types'
import { createEmptyBoard, createPlayer } from './types'

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
  recordMove: (move: Omit<Move, 'id' | 'timestamp'>) => void
  updateBoard: (board: BoardState) => void
  nextTurn: () => void
  updatePlayerTime: (playerIndex: number, timeRemainingMs: number) => void

  // Timer
  startTimer: () => void
  stopTimer: () => void

  // Player records
  addPlayerRecord: (name: string) => void
  getPlayerNames: () => string[]
}

const generateId = () => Math.random().toString(36).substring(2, 9)

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
          id: generateId(),
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

        // Determine winner(s)
        const maxScore = Math.max(...currentGame.players.map(p => p.score))

        // Create game summary
        const summary: GameSummary = {
          id: currentGame.id,
          date: currentGame.createdAt,
          players: currentGame.players.map(p => ({
            name: p.name,
            score: p.score,
            isWinner: p.score === maxScore,
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

        const newMove: Move = {
          ...move,
          id: generateId(),
          timestamp: Date.now(),
        }

        const updatedPlayers = [...currentGame.players]
        updatedPlayers[move.playerIndex] = {
          ...updatedPlayers[move.playerIndex],
          score: updatedPlayers[move.playerIndex].score + move.totalScore,
        }

        set({
          currentGame: {
            ...currentGame,
            moves: [...currentGame.moves, newMove],
            players: updatedPlayers,
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
