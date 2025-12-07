import type { Meta, StoryObj } from '@storybook/react'
import { PlayerSetupScreen } from '../components/PlayerSetupScreen'

const meta = {
  title: 'Screens/PlayerSetupScreen',
  component: PlayerSetupScreen,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onStartGame: () => {},
    onBack: () => {},
  },
} satisfies Meta<typeof PlayerSetupScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  name: 'No Previous Players',
}

export const WithPreviousPlayers: Story = {
  name: 'With Previous Players',
  decorators: [
    Story => {
      const { useGameStore } = require('@/lib/gameStore')
      const state = useGameStore.getState()
      useGameStore.setState({
        ...state,
        playerRecords: [
          { name: 'Herb', gamesPlayed: 15, lastPlayedAt: Date.now() },
          { name: 'Lynne', gamesPlayed: 12, lastPlayedAt: Date.now() - 86_400_000 },
          { name: 'Nolan', gamesPlayed: 8, lastPlayedAt: Date.now() - 172_800_000 },
          { name: 'Mike', gamesPlayed: 6, lastPlayedAt: Date.now() - 259_200_000 },
          { name: 'Alison', gamesPlayed: 4, lastPlayedAt: Date.now() - 345_600_000 },
          { name: 'Mark', gamesPlayed: 3, lastPlayedAt: Date.now() - 432_000_000 },
        ],
      })
      return <Story />
    },
  ],
}
