import type { Meta, StoryObj } from '@storybook/react'
import { HomeScreen } from '@/components/HomeScreen'
import { useGameStore } from '@/lib/gameStore'
import { createEmptyBoard, createPlayer } from '@/lib/types'

const meta = {
  title: 'Screens/HomeScreen',
  component: HomeScreen,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onNewGame: () => {},
    onResumeGame: () => {},
  },
} satisfies Meta<typeof HomeScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  name: 'No Past Games',
}

export const WithPastGames: Story = {
  name: 'With Past Games',
  decorators: [
    Story => {
      // Mock the store with past games
      const state = useGameStore.getState()
      useGameStore.setState({
        ...state,
        pastGames: [
          {
            date: Date.now() - 86_400_000, // Yesterday
            players: [
              { name: 'Herb', score: 287, isWinner: true },
              { name: 'Lynne', score: 245, isWinner: false },
            ],
          },
          {
            date: Date.now() - 172_800_000, // 2 days ago
            players: [
              { name: 'Mike', score: 312, isWinner: true },
              { name: 'Nolan', score: 298, isWinner: false },
            ],
          },
          {
            date: Date.now() - 604_800_000, // 1 week ago
            players: [
              { name: 'Alison', score: 265, isWinner: false },
              { name: 'Mark', score: 289, isWinner: true },
              { name: 'Sharon', score: 201, isWinner: false },
            ],
          },
        ],
      })
      return <Story />
    },
  ],
}

export const WithCurrentGame: Story = {
  name: 'With Resumable Game',
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
        pastGames: [
          {
            date: Date.now() - 86_400_000,
            players: [
              { name: 'Herb', score: 287, isWinner: true },
              { name: 'Lynne', score: 245, isWinner: false },
            ],
          },
        ],
      })
      return <Story />
    },
  ],
}
