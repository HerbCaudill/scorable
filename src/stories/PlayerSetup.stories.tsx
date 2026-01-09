import type { Meta, StoryObj } from "@storybook/react"
import { PlayerSetup } from "@/components/PlayerSetup"

const meta = {
  title: "Screens/PlayerSetup",
  component: PlayerSetup,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    Story => (
      <div className="min-h-screen bg-white p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerSetup>

export default meta
type Story = StoryObj<typeof meta>

const previousPlayers = ["Herb", "Nolan", "Mike", "Alison", "Mark", "Sharon", "Lynne"]

export const Empty: Story = {
  args: {
    previousPlayers,
  },
}

export const NoPreviousPlayers: Story = {
  name: "No previous players",
  args: {
    previousPlayers: [],
  },
}

export const WithOnStartGame: Story = {
  name: "With onStartGame callback",
  args: {
    previousPlayers,
    onStartGame: players => {
      alert(`Starting game with: ${players.join(", ")}`)
    },
  },
}
