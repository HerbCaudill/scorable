import type { Meta, StoryObj } from '@storybook/react'
import ScrabbleBoard from '../components/ScrabbleBoard'
import { createEmptyBoard, type BoardState } from '../lib/board'

const meta = {
  title: 'Components/ScrabbleBoard',
  component: ScrabbleBoard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="w-[min(90vw,512px)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScrabbleBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Create a board with some tiles placed (showing "HELLO" horizontally from center)
const boardWithHello = (): BoardState => {
  const board = createEmptyBoard()
  const word = 'HELLO'
  const startCol = 5
  const row = 7 // Center row
  for (let i = 0; i < word.length; i++) {
    board[row][startCol + i] = word[i]
  }

  return board
}

export const WithTiles: Story = {
  args: {
    tiles: boardWithHello(),
  },
}

// Create a board with multiple words
const boardWithMultipleWords = (): BoardState => {
  const board = createEmptyBoard()

  // HELLO horizontally
  const hello = 'HELLO'
  for (let i = 0; i < hello.length; i++) {
    board[7][5 + i] = hello[i]
  }

  // WORLD vertically, intersecting at the L
  const world = 'WORLD'
  for (let i = 0; i < world.length; i++) {
    board[6 + i][9] = world[i]
  }

  return board
}

export const WithMultipleWords: Story = {
  args: {
    tiles: boardWithMultipleWords(),
  },
}
