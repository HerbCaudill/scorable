import { BOARD_LAYOUT, type SquareType } from '../lib/board'
import { cx } from '../lib/cx'

const ScrabbleBoard = () => {
  // Dots component for multipliers
  const Dots = ({ count, light, rotation }: { count: number; light: boolean; rotation: string }) => {
    return (
      <div className={cx('flex gap-1', rotation)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cx('w-1.5 h-1.5 rounded-full', light ? 'bg-neutral-800' : 'bg-white')} />
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
    const center = 7
    // Get rotation angle based on position relative to center
    const rotation =
      row === center && col === center
        ? 'rotate-0' // Center
        : row === center
        ? 'rotate-0' // Center row - horizontal
        : col === center
        ? 'rotate-90' // Center column - vertical
        : row < center && col < center
        ? 'rotate-45' // Top-left quadrant
        : row < center && col > center
        ? 'rotate-[135deg]' // Top-right quadrant
        : row > center && col < center
        ? '-rotate-45' // Bottom-left quadrant
        : '-rotate-[135deg]' // Bottom-right quadrant

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
            className={cx(
              'w-10 h-10 flex items-center justify-center border-b border-r border-neutral-300',
              rowIndex === 0 && 'border-t',
              colIndex === 0 && 'border-l',
              squareType === 'DW' || squareType === 'TW' || squareType === 'ST' ? 'bg-neutral-800' : 'bg-white'
            )}
          >
            {renderSquareContent(squareType, rowIndex, colIndex)}
          </div>
        ))
      )}
    </div>
  )
}

export default ScrabbleBoard
