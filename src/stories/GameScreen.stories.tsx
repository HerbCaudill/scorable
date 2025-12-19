import type { Meta, StoryObj } from '@storybook/react'
import { useEffect } from 'react'
import { GameScreen } from '@/components/GameScreen'
import { useGameStore } from '@/lib/gameStore'
import { createEmptyBoard, createPlayer, DEFAULT_TIME_MS, type Game } from '@/lib/types'

// Helper to reset store and optionally set a game
const useStoreSetup = (game: Game | null) => {
  useEffect(() => {
    const state = useGameStore.getState()
    useGameStore.setState({
      ...state,
      currentGame: game,
    })
  }, [])
}

const meta = {
  title: 'Screens/GameScreen',
  component: GameScreen,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onEndGame: () => {},
  },
} satisfies Meta<typeof GameScreen>

export default meta
type Story = StoryObj<typeof meta>

export const NoGame: Story = {
  name: 'No Active Game',
  decorators: [
    Story => {
      useStoreSetup(null)
      return <Story />
    },
  ],
}

export const NewGame: Story = {
  name: 'New Game - 2 Players',
  decorators: [
    Story => {
      useStoreSetup({
        id: crypto.randomUUID(),
        players: [createPlayer('Herb', 0), createPlayer('Lynne', 1)],
        currentPlayerIndex: 0,
        board: createEmptyBoard(),
        moves: [],
        status: 'playing',
        timerRunning: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      return <Story />
    },
  ],
}

export const FourPlayers: Story = {
  name: 'New Game - 4 Players',
  decorators: [
    Story => {
      useStoreSetup({
        id: crypto.randomUUID(),
        players: [createPlayer('Herb', 0), createPlayer('Lynne', 1), createPlayer('Nolan', 2), createPlayer('Mike', 3)],
        currentPlayerIndex: 0,
        board: createEmptyBoard(),
        moves: [],
        status: 'playing',
        timerRunning: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      return <Story />
    },
  ],
}

export const InProgress: Story = {
  name: 'Game In Progress - 2 Players',
  decorators: [
    Story => {
      // Create board with some tiles
      const board = createEmptyBoard()
      // Place "HELLO" horizontally starting at center (Herb's move)
      board[7][7] = 'H'
      board[7][8] = 'E'
      board[7][9] = 'L'
      board[7][10] = 'L'
      board[7][11] = 'O'
      // Place "WORLD" vertically using the O from HELLO (Lynne's move)
      // W-O-R-L-D where O is already on the board at (7,11)
      board[6][11] = 'W'
      // O at (7,11) already placed
      board[8][11] = 'R'
      board[9][11] = 'L'
      board[10][11] = 'D'

      useStoreSetup({
        id: crypto.randomUUID(),
        players: [
          { ...createPlayer('Herb', 0), timeRemainingMs: DEFAULT_TIME_MS - 180_000 }, // 27 min left
          { ...createPlayer('Lynne', 1), timeRemainingMs: DEFAULT_TIME_MS - 120_000 }, // 28 min left
        ],
        currentPlayerIndex: 0, // Back to Herb's turn after both have played
        board,
        moves: [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 7, tile: 'H' },
              { row: 7, col: 8, tile: 'E' },
              { row: 7, col: 9, tile: 'L' },
              { row: 7, col: 10, tile: 'L' },
              { row: 7, col: 11, tile: 'O' },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 6, col: 11, tile: 'W' },
              { row: 8, col: 11, tile: 'R' },
              { row: 9, col: 11, tile: 'L' },
              { row: 10, col: 11, tile: 'D' },
            ],
          },
        ],
        status: 'playing',
        timerRunning: true,
        createdAt: Date.now() - 300_000,
        updatedAt: Date.now(),
      })
      return <Story />
    },
  ],
}

export const ThreePlayersInProgress: Story = {
  name: 'Game In Progress - 3 Players',
  decorators: [
    Story => {
      const board = createEmptyBoard()
      // Move 1: "GAME" horizontally at center (Alice)
      board[7][5] = 'G'
      board[7][6] = 'A'
      board[7][7] = 'M'
      board[7][8] = 'E'
      // Move 2: "PLAY" vertically using A (Bob)
      board[5][6] = 'P'
      board[6][6] = 'L'
      // A at (7,6) already placed
      board[8][6] = 'Y'
      // Move 3: "ZONE" horizontally using E (Charlie)
      board[7][9] = 'Z'
      board[7][10] = 'O'
      board[7][11] = 'N'
      // E at (7,8) reused conceptually - placing new word
      // Actually place "ZONE" starting after E
      // Move 4: "MAZE" vertically using M (Alice)
      board[5][7] = 'A'
      board[6][7] = 'Z'
      // M at (7,7) already placed
      board[8][7] = 'E'
      // Move 5: "YEN" horizontally using Y (Bob)
      board[8][5] = 'E'
      // Y at (8,6) already placed
      board[8][8] = 'N'

      useStoreSetup({
        id: crypto.randomUUID(),
        players: [
          { ...createPlayer('Alice', 0), timeRemainingMs: DEFAULT_TIME_MS - 240_000 }, // 26 min left
          { ...createPlayer('Bob', 1), timeRemainingMs: DEFAULT_TIME_MS - 180_000 }, // 27 min left
          { ...createPlayer('Charlie', 2), timeRemainingMs: DEFAULT_TIME_MS - 90_000 }, // 28.5 min left
        ],
        currentPlayerIndex: 2, // Charlie's turn
        board,
        moves: [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 5, tile: 'G' },
              { row: 7, col: 6, tile: 'A' },
              { row: 7, col: 7, tile: 'M' },
              { row: 7, col: 8, tile: 'E' },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 5, col: 6, tile: 'P' },
              { row: 6, col: 6, tile: 'L' },
              { row: 8, col: 6, tile: 'Y' },
            ],
          },
          {
            playerIndex: 2,
            tilesPlaced: [
              { row: 7, col: 9, tile: 'Z' },
              { row: 7, col: 10, tile: 'O' },
              { row: 7, col: 11, tile: 'N' },
            ],
          },
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 5, col: 7, tile: 'A' },
              { row: 6, col: 7, tile: 'Z' },
              { row: 8, col: 7, tile: 'E' },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 8, col: 5, tile: 'E' },
              { row: 8, col: 8, tile: 'N' },
            ],
          },
        ],
        status: 'playing',
        timerRunning: true,
        createdAt: Date.now() - 600_000,
        updatedAt: Date.now(),
      })
      return <Story />
    },
  ],
}

export const FourPlayersInProgress: Story = {
  name: 'Game In Progress - 4 Players',
  decorators: [
    Story => {
      const board = createEmptyBoard()
      // Move 1: "WORD" horizontally at center (Herb)
      board[7][6] = 'W'
      board[7][7] = 'O'
      board[7][8] = 'R'
      board[7][9] = 'D'
      // Move 2: "OVER" vertically using O (Lynne)
      board[5][7] = 'V'
      board[6][7] = 'E'
      // O at (7,7) already placed
      board[8][7] = 'R'
      // Move 3: "DRAW" horizontally using D (Nolan)
      board[7][10] = 'R'
      board[7][11] = 'A'
      board[7][12] = 'W'
      // Move 4: "VET" horizontally using V (Mike)
      // V at (5,7) already placed
      board[5][8] = 'E'
      board[5][9] = 'T'
      // Move 5: "TOWER" vertically using T (Herb)
      board[3][9] = 'O'
      board[4][9] = 'W'
      // T at (5,9) already placed
      board[6][9] = 'E'
      // R at (7,9) - actually this is D, adjust
      // Move 6: "AWE" vertically using A (Lynne)
      board[6][11] = 'W'
      // A at (7,11) already placed
      board[8][11] = 'E'
      // Move 7: "RED" horizontally using R (Nolan)
      // R at (8,7) already placed
      board[8][8] = 'E'
      board[8][9] = 'D'

      useStoreSetup({
        id: crypto.randomUUID(),
        players: [
          { ...createPlayer('Herb', 0), timeRemainingMs: DEFAULT_TIME_MS - 300_000 }, // 25 min left
          { ...createPlayer('Lynne', 1), timeRemainingMs: DEFAULT_TIME_MS - 240_000 }, // 26 min left
          { ...createPlayer('Nolan', 2), timeRemainingMs: DEFAULT_TIME_MS - 180_000 }, // 27 min left
          { ...createPlayer('Mike', 3), timeRemainingMs: DEFAULT_TIME_MS - 150_000 }, // 27.5 min left
        ],
        currentPlayerIndex: 3, // Mike's turn
        board,
        moves: [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 6, tile: 'W' },
              { row: 7, col: 7, tile: 'O' },
              { row: 7, col: 8, tile: 'R' },
              { row: 7, col: 9, tile: 'D' },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 5, col: 7, tile: 'V' },
              { row: 6, col: 7, tile: 'E' },
              { row: 8, col: 7, tile: 'R' },
            ],
          },
          {
            playerIndex: 2,
            tilesPlaced: [
              { row: 7, col: 10, tile: 'R' },
              { row: 7, col: 11, tile: 'A' },
              { row: 7, col: 12, tile: 'W' },
            ],
          },
          {
            playerIndex: 3,
            tilesPlaced: [
              { row: 5, col: 8, tile: 'E' },
              { row: 5, col: 9, tile: 'T' },
            ],
          },
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 3, col: 9, tile: 'O' },
              { row: 4, col: 9, tile: 'W' },
              { row: 6, col: 9, tile: 'E' },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 6, col: 11, tile: 'W' },
              { row: 8, col: 11, tile: 'E' },
            ],
          },
          {
            playerIndex: 2,
            tilesPlaced: [
              { row: 8, col: 8, tile: 'E' },
              { row: 8, col: 9, tile: 'D' },
            ],
          },
        ],
        status: 'playing',
        timerRunning: true,
        createdAt: Date.now() - 900_000,
        updatedAt: Date.now(),
      })
      return <Story />
    },
  ],
}
