import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import ScrabbleBoard from '../components/ScrabbleBoard'
import { createEmptyBoard, createTile, type BoardState } from '../lib/board'

const meta = {
  title: 'Components/ScrabbleBoard',
  component: ScrabbleBoard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
    board[row][startCol + i] = createTile(word[i])
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
    board[7][5 + i] = createTile(hello[i])
  }

  // WORLD vertically, intersecting at the L
  const world = 'WORLD'
  for (let i = 0; i < world.length; i++) {
    board[6 + i][9] = createTile(world[i])
  }

  return board
}

export const WithMultipleWords: Story = {
  args: {
    tiles: boardWithMultipleWords(),
  },
}

// Interactive board for placing tiles
const InteractiveBoard = () => {
  const [tiles, setTiles] = useState<BoardState>(createEmptyBoard())
  const [selectedSquare, setSelectedSquare] = useState<{
    row: number
    col: number
  } | null>(null)
  const [currentLetter, setCurrentLetter] = useState('A')

  const handleSquareClick = (row: number, col: number) => {
    // If clicking on an existing tile, remove it
    if (tiles[row][col]) {
      const newTiles = tiles.map(r => [...r])
      newTiles[row][col] = null
      setTiles(newTiles)
      setSelectedSquare(null)
      return
    }

    // Place the current letter
    const newTiles = tiles.map(r => [...r])
    newTiles[row][col] = createTile(currentLetter)
    setTiles(newTiles)

    // Cycle to next letter
    setCurrentLetter(prev => {
      const code = prev.charCodeAt(0)
      return code >= 90 ? 'A' : String.fromCharCode(code + 1)
    })
    setSelectedSquare(null)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">
          Current letter:
          <input
            type="text"
            maxLength={1}
            value={currentLetter}
            onChange={event => setCurrentLetter(event.target.value.toUpperCase())}
            className="ml-2 w-12 rounded border px-2 py-1 text-center uppercase"
          />
        </label>
        <button
          type="button"
          onClick={() => setTiles(createEmptyBoard())}
          className="rounded border px-3 py-1 text-sm hover:bg-neutral-100"
        >
          Clear board
        </button>
      </div>
      <p className="text-sm text-neutral-500">Click a square to place a tile. Click an existing tile to remove it.</p>
      <ScrabbleBoard tiles={tiles} onSquareClick={handleSquareClick} selectedSquare={selectedSquare} />
    </div>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveBoard />,
}
