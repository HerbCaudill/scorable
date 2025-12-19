import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import ScrabbleBoard from '@/components/ScrabbleBoard'
import { type BoardState } from '@/lib/types'
import { createEmptyBoard } from '@/lib/createEmptyBoard'

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

// Editable board story with controlled state
const EditableBoardWrapper = () => {
  const [tiles, setTiles] = useState<BoardState>(createEmptyBoard)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-600">
        Click any square to place the cursor, then type letters. Click the cursor to toggle direction. Use arrow keys to
        move, backspace to delete.
      </p>
      <ScrabbleBoard tiles={tiles} onTilesChange={setTiles} editable />
    </div>
  )
}

export const Editable: Story = {
  render: () => <EditableBoardWrapper />,
}

// Editable board with some existing tiles
const EditableWithTilesWrapper = () => {
  const existingTiles = boardWithHello()
  const [tiles, setTiles] = useState<BoardState>(() => existingTiles.map(row => [...row]))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-600">
        Board with existing tiles (shown in light blue). When typing, the cursor skips over existing tiles. Click
        directly on a tile to overwrite it.
      </p>
      <ScrabbleBoard tiles={tiles} existingTiles={existingTiles} onTilesChange={setTiles} editable />
    </div>
  )
}

export const EditableWithExistingTiles: Story = {
  render: () => <EditableWithTilesWrapper />,
}

// Board with a blank tile
const boardWithBlank = (): BoardState => {
  const board = createEmptyBoard()
  // QUIZ with blank used as U
  board[7][5] = 'Q'
  board[7][6] = ' ' // Blank tile
  board[7][7] = 'I'
  board[7][8] = 'Z'
  return board
}

export const WithBlankTile: Story = {
  args: {
    tiles: boardWithBlank(),
  },
}
