import type { Meta, StoryObj } from '@storybook/react'
import { useEffect } from 'react'
import { UnplayedTilesScreen } from '@/components/TileBagScreen'
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
  title: 'Screens/UnplayedTilesScreen',
  component: UnplayedTilesScreen,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onBack: () => {},
  },
} satisfies Meta<typeof UnplayedTilesScreen>

export default meta
type Story = StoryObj<typeof meta>

export const NewGame: Story = {
  name: 'New game - all tiles available',
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

export const SomeTilesPlayed: Story = {
  name: 'Some tiles played',
  decorators: [
    Story => {
      const board = createEmptyBoard()
      // Place "HELLO" horizontally starting at center
      board[7][7] = 'H'
      board[7][8] = 'E'
      board[7][9] = 'L'
      board[7][10] = 'L'
      board[7][11] = 'O'
      // Place "WORLD" vertically using the O from HELLO
      board[6][11] = 'W'
      board[8][11] = 'R'
      board[9][11] = 'L'
      board[10][11] = 'D'

      useStoreSetup({
        id: crypto.randomUUID(),
        players: [
          { ...createPlayer('Herb', 0), timeRemainingMs: DEFAULT_TIME_MS - 180_000 },
          { ...createPlayer('Lynne', 1), timeRemainingMs: DEFAULT_TIME_MS - 120_000 },
        ],
        currentPlayerIndex: 0,
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

export const ManyTilesPlayed: Story = {
  name: 'Many tiles played',
  decorators: [
    Story => {
      const board = createEmptyBoard()
      // Place many words to deplete tiles
      // QUARTZ at center
      board[7][5] = 'Q'
      board[7][6] = 'U'
      board[7][7] = 'A'
      board[7][8] = 'R'
      board[7][9] = 'T'
      board[7][10] = 'Z'
      // JAZZ vertically
      board[5][10] = 'J'
      board[6][10] = 'A'
      // Z at 7,10
      board[8][10] = 'Z'
      // XENON
      board[9][6] = 'X'
      board[9][7] = 'E'
      board[9][8] = 'N'
      board[9][9] = 'O'
      board[9][10] = 'N'
      // VELVET
      board[5][5] = 'V'
      board[5][6] = 'E'
      board[5][7] = 'L'
      board[5][8] = 'V'
      board[5][9] = 'E'
      // BLANKS used
      board[6][5] = ' ' // blank as S
      board[6][6] = ' ' // blank as T

      useStoreSetup({
        id: crypto.randomUUID(),
        players: [
          { ...createPlayer('Herb', 0), timeRemainingMs: DEFAULT_TIME_MS - 600_000 },
          { ...createPlayer('Lynne', 1), timeRemainingMs: DEFAULT_TIME_MS - 500_000 },
        ],
        currentPlayerIndex: 0,
        board,
        moves: [
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 7, col: 5, tile: 'Q' },
              { row: 7, col: 6, tile: 'U' },
              { row: 7, col: 7, tile: 'A' },
              { row: 7, col: 8, tile: 'R' },
              { row: 7, col: 9, tile: 'T' },
              { row: 7, col: 10, tile: 'Z' },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 5, col: 10, tile: 'J' },
              { row: 6, col: 10, tile: 'A' },
              { row: 8, col: 10, tile: 'Z' },
            ],
          },
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 9, col: 6, tile: 'X' },
              { row: 9, col: 7, tile: 'E' },
              { row: 9, col: 8, tile: 'N' },
              { row: 9, col: 9, tile: 'O' },
              { row: 9, col: 10, tile: 'N' },
            ],
          },
          {
            playerIndex: 1,
            tilesPlaced: [
              { row: 5, col: 5, tile: 'V' },
              { row: 5, col: 6, tile: 'E' },
              { row: 5, col: 7, tile: 'L' },
              { row: 5, col: 8, tile: 'V' },
              { row: 5, col: 9, tile: 'E' },
            ],
          },
          {
            playerIndex: 0,
            tilesPlaced: [
              { row: 6, col: 5, tile: ' ' },
              { row: 6, col: 6, tile: ' ' },
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

export const NearlyEmpty: Story = {
  name: 'Nearly empty - end game',
  decorators: [
    Story => {
      const board = createEmptyBoard()
      // Simulate a game near the end with most tiles used
      // Fill the board with lots of words
      const words = [
        { row: 7, col: 3, word: 'SCRABBLE' },
        { row: 5, col: 7, word: 'CAT', vertical: true },
        { row: 8, col: 3, word: 'QUIZ', vertical: true },
        { row: 6, col: 9, word: 'JAZZ', vertical: true },
        { row: 3, col: 5, word: 'XENON' },
        { row: 4, col: 5, word: 'VELVET' },
        { row: 9, col: 5, word: 'WORLD' },
        { row: 10, col: 5, word: 'HELLO' },
        { row: 11, col: 5, word: 'QUICK' },
        { row: 12, col: 5, word: 'BROWN' },
      ]

      words.forEach(({ row, col, word, vertical }) => {
        for (let i = 0; i < word.length; i++) {
          if (vertical) {
            board[row + i][col] = word[i]
          } else {
            board[row][col + i] = word[i]
          }
        }
      })

      // Build moves array
      const moves = words.map((w, i) => ({
        playerIndex: i % 2,
        tilesPlaced: w.word.split('').map((tile, j) => ({
          row: w.vertical ? w.row + j : w.row,
          col: w.vertical ? w.col : w.col + j,
          tile,
        })),
      }))

      useStoreSetup({
        id: crypto.randomUUID(),
        players: [
          { ...createPlayer('Herb', 0), timeRemainingMs: DEFAULT_TIME_MS - 1200_000 },
          { ...createPlayer('Lynne', 1), timeRemainingMs: DEFAULT_TIME_MS - 1100_000 },
        ],
        currentPlayerIndex: 0,
        board,
        moves,
        status: 'playing',
        timerRunning: true,
        createdAt: Date.now() - 1500_000,
        updatedAt: Date.now(),
      })
      return <Story />
    },
  ],
}
