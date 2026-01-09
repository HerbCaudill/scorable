import type { Meta, StoryObj } from "@storybook/react"
import { useEffect } from "react"
import { HomeScreen } from "@/components/HomeScreen"
import { useGameStore } from "@/lib/gameStore"
import { createEmptyBoard, createPlayer, type Game } from "@/lib/types"

// Helper to create a finished game with some moves for score calculation
const createFinishedGame = (
  playerNames: string[],
  moves: Game["moves"],
  createdAt: number,
): Game => {
  const board = createEmptyBoard()
  for (const move of moves) {
    for (const { row, col, tile } of move.tilesPlaced) {
      board[row][col] = tile
    }
  }
  return {
    players: playerNames.map((name, i) => createPlayer(name, i)),
    currentPlayerIndex: 0,
    board,
    moves,
    timerEvents: [],
    status: "finished",
    createdAt,
    updatedAt: createdAt,
  }
}

// Helper to reset and set store state
const useStoreSetup = (state: { currentGame: Game | null; pastGames: Game[] }) => {
  useEffect(() => {
    useGameStore.setState({
      currentGame: state.currentGame,
      pastGames: state.pastGames,
      playerRecords: [],
    })
  }, [])
}

const meta = {
  title: "Screens/HomeScreen",
  component: HomeScreen,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onNewGame: () => {},
    onResumeGame: () => {},
    onViewPastGame: () => {},
  },
} satisfies Meta<typeof HomeScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  name: "No past games",
  decorators: [
    Story => {
      useStoreSetup({ currentGame: null, pastGames: [] })
      return <Story />
    },
  ],
}

export const WithPastGames: Story = {
  name: "With past games",
  decorators: [
    Story => {
      useStoreSetup({
        currentGame: null,
        pastGames: [
          createFinishedGame(
            ["Herb", "Lynne"],
            [
              {
                playerIndex: 0,
                tilesPlaced: [
                  { row: 7, col: 7, tile: "H" },
                  { row: 7, col: 8, tile: "I" },
                ],
              },
              { playerIndex: 1, tilesPlaced: [{ row: 8, col: 7, tile: "A" }] },
            ],
            Date.now() - 86_400_000,
          ),
          createFinishedGame(
            ["Mike", "Nolan"],
            [
              {
                playerIndex: 0,
                tilesPlaced: [
                  { row: 7, col: 7, tile: "G" },
                  { row: 7, col: 8, tile: "O" },
                ],
              },
            ],
            Date.now() - 172_800_000,
          ),
        ],
      })
      return <Story />
    },
  ],
}

export const WithCurrentGame: Story = {
  name: "With resumable game",
  decorators: [
    Story => {
      useStoreSetup({
        currentGame: {
          players: [createPlayer("Herb", 0), createPlayer("Lynne", 1)],
          currentPlayerIndex: 0,
          board: createEmptyBoard(),
          moves: [],
          timerEvents: [],
          status: "playing",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        pastGames: [
          createFinishedGame(
            ["Herb", "Lynne"],
            [
              {
                playerIndex: 0,
                tilesPlaced: [
                  { row: 7, col: 7, tile: "H" },
                  { row: 7, col: 8, tile: "I" },
                ],
              },
            ],
            Date.now() - 86_400_000,
          ),
        ],
      })
      return <Story />
    },
  ],
}
