import { BOARD_LAYOUT, type SquareType } from '../lib/board'

const ScrabbleBoard = () => {
  const center = 7

  // Get rotation angle based on position relative to center
  const getRotation = (row: number, col: number): string => {
    if (row === center && col === center) return 'rotate-0' // Center
    if (row === center) return 'rotate-0' // Center row - horizontal
    if (col === center) return 'rotate-90' // Center column - vertical
    if (row < center && col < center) return 'rotate-45' // Top-left quadrant
    if (row < center && col > center) return 'rotate-[135deg]' // Top-right quadrant
    if (row > center && col < center) return '-rotate-45' // Bottom-left quadrant
    return '-rotate-[135deg]' // Bottom-right quadrant
  }

  const getSquareClasses = (squareType: SquareType): string => {
    // DW/TW/ST get dark background, DL/TL get light background
    if (squareType === 'DW' || squareType === 'TW' || squareType === 'ST') {
      return 'bg-neutral-800'
    }
    return 'bg-white'
  }

  // Dots component for multipliers
  const Dots = ({ count, light, rotation }: { count: number; light: boolean; rotation: string }) => {
    const dotColor = light ? 'bg-neutral-800' : 'bg-white'
    return (
      <div className={`flex gap-1 ${rotation}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        ))}
      </div>
    )
  }

  // Bulls-eye component for start square
  const BullsEye = () => (
    <div className="relative flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>
    </div>
  )

  const renderSquareContent = (squareType: SquareType, row: number, col: number) => {
    const rotation = getRotation(row, col)
    switch (squareType) {
      case 'DL':
        return <Dots count={2} light rotation={rotation} />
      case 'TL':
        return <Dots count={3} light rotation={rotation} />
      case 'DW':
        return <Dots count={2} light={false} rotation={rotation} />
      case 'TW':
        return <Dots count={3} light={false} rotation={rotation} />
      case 'ST':
        return <BullsEye />
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-15 w-150 h-150 gap-0">
      {BOARD_LAYOUT.map((row, rowIndex) =>
        row.map((squareType, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-10 h-10 flex items-center justify-center border-b border-r border-neutral-300 ${
              rowIndex === 0 ? 'border-t' : ''
            } ${colIndex === 0 ? 'border-l' : ''} ${getSquareClasses(squareType)}`}
          >
            {renderSquareContent(squareType, rowIndex, colIndex)}
          </div>
        ))
      )}
    </div>
  )
}

export default ScrabbleBoard
