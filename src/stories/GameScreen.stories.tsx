import type { Meta, StoryObj } from '@storybook/react'
import { GameScreen } from '../components/GameScreen'
import { useGameStore } from '@/lib/gameStore'
import { createEmptyBoard, createPlayer, DEFAULT_TIME_MS } from '@/lib/types'

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
}

export const NewGame: Story = {
  name: 'New Game - 2 Players',
  decorators: [
    Story => {
      const state = useGameStore.getState()
      useGameStore.setState({
        ...state,
        currentGame: {
          players: [createPlayer('Herb', 0), createPlayer('Lynne', 1)],
          currentPlayerIndex: 0,
          board: createEmptyBoard(),
          moves: [],
          status: 'playing',
          timerRunning: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      })
      return <Story />
    },
  ],
}

export const FourPlayers: Story = {
  name: 'New Game - 4 Players',
  decorators: [
    Story => {
      const state = useGameStore.getState()
      useGameStore.setState({
        ...state,
        currentGame: {
          players: [
            createPlayer('Herb', 0),
            createPlayer('Lynne', 1),
            createPlayer('Nolan', 2),
            createPlayer('Mike', 3),
          ],
          currentPlayerIndex: 0,
          board: createEmptyBoard(),
          moves: [],
          status: 'playing',
          timerRunning: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      })
      return <Story />
    },
  ],
}

export const InProgress: Story = {
  name: 'Game In Progress',
  decorators: [
    Story => {
      // Create board with some tiles
      const board = createEmptyBoard()
      // Place "HELLO" horizontally starting at center
      board[7][7] = 'H'
      board[7][8] = 'E'
      board[7][9] = 'L'
      board[7][10] = 'L'
      board[7][11] = 'O'
      // Place "WORLD" vertically from the L
      board[8][9] = 'W'
      board[9][9] = 'O'
      board[10][9] = 'R'
      board[11][9] = 'L'
      board[12][9] = 'D'

      const state = useGameStore.getState()
      useGameStore.setState({
        ...state,
        currentGame: {
          players: [
            { ...createPlayer('Herb', 0), timeRemainingMs: DEFAULT_TIME_MS - 180_000 }, // 27 min left
            { ...createPlayer('Lynne', 1), timeRemainingMs: DEFAULT_TIME_MS - 120_000 }, // 28 min left
          ],
          currentPlayerIndex: 1,
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
                { row: 8, col: 9, tile: 'W' },
                { row: 9, col: 9, tile: 'O' },
                { row: 10, col: 9, tile: 'R' },
                { row: 11, col: 9, tile: 'L' },
                { row: 12, col: 9, tile: 'D' },
              ],
            },
          ],
          status: 'playing',
          timerRunning: true,
          createdAt: Date.now() - 300_000,
          updatedAt: Date.now(),
        },
      })
      return <Story />
    },
  ],
}
