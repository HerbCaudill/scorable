import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Select } from '../components/Select'

const PlayerSetupScreen = () => {
  const [players, setPlayers] = useState<string[]>(['', '', '', ''])

  const previousPlayers = [
    { value: 'herb', label: 'Herb' },
    { value: 'lynne', label: 'Lynne' },
    { value: 'nolan', label: 'Nolan' },
    { value: 'mike', label: 'Mike' },
    { value: 'alison', label: 'Alison' },
    { value: 'mark', label: 'Mark' },
    { value: 'sharon', label: 'Sharon' },
  ]

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = value
    setPlayers(newPlayers)
  }

  const filledPlayers = players.filter(p => p.trim() !== '').length
  const canStart = filledPlayers >= 2

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <h1 className="text-3xl font-bold text-black mb-8">Select players</h1>

      <div className="space-y-6 flex-1">
        {players.map((player, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-black mb-2">Player {index + 1}</label>
            <Select
              options={previousPlayers}
              value={player}
              onChange={e => handlePlayerChange(index, e.target.value)}
              placeholder={`Player ${index + 1}`}
            />
            <div className="text-xs text-gray-600 mt-2">Or enter new name:</div>
            <Input
              placeholder="New player name"
              value={player}
              onChange={e => handlePlayerChange(index, e.target.value)}
              className="mt-2"
            />
          </div>
        ))}
      </div>

      <Button variant="primary" size="lg" disabled={!canStart} className="w-full">
        Start game
      </Button>
    </div>
  )
}

const meta = {
  title: 'Screens/Player Setup',
  component: PlayerSetupScreen,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PlayerSetupScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
