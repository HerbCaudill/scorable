import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/Button'

const BOARD_SIZE = 15

type SquareType = 'normal' | 'dl' | 'tl' | 'dw' | 'tw'

const getSquareType = (row: number, col: number): SquareType => {
  // Center star
  if (row === 7 && col === 7) return 'tw'

  // Premium squares based on symmetry
  const premiumSquares: Record<string, SquareType> = {
    // Triple word (corners and cross pattern)
    '0,0': 'tw',
    '0,7': 'tw',
    '0,14': 'tw',
    '7,0': 'tw',
    '7,14': 'tw',
    '14,0': 'tw',
    '14,7': 'tw',
    '14,14': 'tw',
    // Double word
    '1,1': 'dw',
    '2,2': 'dw',
    '3,3': 'dw',
    '4,4': 'dw',
    '1,13': 'dw',
    '2,12': 'dw',
    '3,11': 'dw',
    '4,10': 'dw',
    '13,1': 'dw',
    '12,2': 'dw',
    '11,3': 'dw',
    '10,4': 'dw',
    '13,13': 'dw',
    '12,12': 'dw',
    '11,11': 'dw',
    '10,10': 'dw',
    '6,6': 'dw',
    '6,8': 'dw',
    '8,6': 'dw',
    '8,8': 'dw',
    // Triple letter
    '1,5': 'tl',
    '1,9': 'tl',
    '5,1': 'tl',
    '5,5': 'tl',
    '5,9': 'tl',
    '5,13': 'tl',
    '9,1': 'tl',
    '9,5': 'tl',
    '9,9': 'tl',
    '9,13': 'tl',
    '13,5': 'tl',
    '13,9': 'tl',
    // Double letter
    '0,3': 'dl',
    '0,11': 'dl',
    '2,6': 'dl',
    '2,8': 'dl',
    '3,0': 'dl',
    '3,7': 'dl',
    '3,14': 'dl',
    '6,2': 'dl',
    '6,6': 'dl',
    '6,8': 'dl',
    '6,12': 'dl',
    '7,3': 'dl',
    '7,11': 'dl',
    '8,2': 'dl',
    '8,6': 'dl',
    '8,8': 'dl',
    '8,12': 'dl',
    '11,0': 'dl',
    '11,7': 'dl',
    '11,14': 'dl',
    '12,6': 'dl',
    '12,8': 'dl',
    '14,3': 'dl',
    '14,11': 'dl',
  }

  return premiumSquares[`${row},${col}`] || 'normal'
}

const getSquareStyles = (type: SquareType): string => {
  const base = 'w-full aspect-square flex items-center justify-center text-xs'
  const styles: Record<SquareType, string> = {
    normal: `${base} bg-gray-100 border border-gray-300`,
    dl: `${base} bg-gray-100 border border-gray-300 text-gray-600`,
    tl: `${base} bg-gray-100 border border-gray-300 text-gray-600`,
    dw: `${base} bg-gray-800 text-white border border-gray-900`,
    tw: `${base} bg-gray-800 text-white border border-gray-900`,
  }
  return styles[type]
}

const getSquareLabel = (type: SquareType): string => {
  const labels: Record<SquareType, string> = {
    normal: '',
    dl: '··',
    tl: '···',
    dw: '··',
    tw: '···',
  }
  return labels[type]
}

const GamePlayScreen = () => {
  return (
    <div className="min-h-screen bg-white p-4 flex flex-col gap-6">
      {/* Board */}
      <div className="flex justify-center">
        <div className="w-full max-w-md aspect-square">
          <div className="grid gap-0 h-full border-4 border-gray-900">
            {Array.from({ length: BOARD_SIZE }).map((_, row) =>
              Array.from({ length: BOARD_SIZE }).map((_, col) => {
                const type = getSquareType(row, col)
                return (
                  <div key={`${row}-${col}`} className={getSquareStyles(type)}>
                    {getSquareLabel(type)}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border-2 border-gray-300 p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-300 border-2 border-black" />
            <div className="flex-1">
              <div className="font-bold text-black">30:00</div>
              <div className="text-sm text-gray-600">Lynne</div>
            </div>
            <div className="font-bold text-2xl text-black">0</div>
          </div>
        </div>

        <div className="border-2 border-blue-400 p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-black" />
            <div className="flex-1">
              <div className="font-bold text-black">30:00</div>
              <div className="text-sm text-gray-600">Herb</div>
            </div>
            <div className="font-bold text-2xl text-black">0</div>
          </div>
        </div>
      </div>

      {/* Move Entry */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Word played"
          className="w-full px-4 py-3 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-black"
        />
        <Button variant="primary" size="lg" className="w-full">
          Submit move
        </Button>
      </div>
    </div>
  )
}

const meta = {
  title: 'Screens/Game Play',
  component: GamePlayScreen,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof GamePlayScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
