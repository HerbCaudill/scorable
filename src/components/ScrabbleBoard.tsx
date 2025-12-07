import { BOARD_LAYOUT, type SquareType, type BoardState, createEmptyBoard, getTileValue } from '../lib/board'
import { cx } from '../lib/cx'

type ScrabbleBoardProps = {
  /** The current state of tiles on the board */
  tiles?: BoardState
  /** Callback when a square is clicked */
  onSquareClick?: (row: number, col: number) => void
  /** The currently selected square (for highlighting) */
  selectedSquare?: { row: number; col: number } | null
}

const ScrabbleBoard = ({ tiles = createEmptyBoard(), onSquareClick, selectedSquare }: ScrabbleBoardProps) => {
  // Dots component for multipliers - sized relative to container
  const Dots = ({ count, light = false, rotation }: { count: number; light?: boolean; rotation: string }) => {
    return (
      <div className={cx('flex gap-[0.9cqw]', rotation)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cx('size-[0.8cqw] rounded-full', light ? 'bg-neutral-800' : 'bg-white')} />
        ))}
      </div>
    )
  }

  // Bulls-eye component for start square - sized relative to container
  const BullsEye = () => (
    <div className="relative flex items-center justify-center">
      <div className="size-[2.5cqw] rounded-full border-[0.15cqw] border-white flex items-center justify-center">
        <div className="size-[1cqw] rounded-full bg-white" />
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
        return <Dots count={2} rotation={rotation} />
      case 'TW':
        return <Dots count={3} rotation={rotation} />
      case 'ST':
        return <BullsEye />
      default:
        return null
    }
  }

  // Tile component to display placed tiles - sized relative to container
  const Tile = ({ letter }: { letter: string }) => {
    const value = getTileValue(letter)
    return (
      <div className="relative flex h-full w-full items-center justify-center rounded-[0.2cqw] bg-amber-100 shadow-sm">
        <span className="text-[3.5cqw] font-bold text-neutral-800 leading-none">{letter.toUpperCase()}</span>
        <span className="absolute bottom-[0.2cqw] right-[0.4cqw] text-[1.6cqw] font-semibold text-neutral-600 leading-none">
          {value > 0 ? value : ''}
        </span>
      </div>
    )
  }

  const isSelected = (row: number, col: number) => selectedSquare?.row === row && selectedSquare?.col === col

  return (
    <div className="@container w-full max-w-2xl">
      <div className="grid w-full aspect-square grid-cols-15 gap-[0.25cqw] bg-neutral-300 p-[0.25cqw]">
        {BOARD_LAYOUT.map((row, rowIndex) =>
          row.map((squareType, colIndex) => {
            const tile = tiles[rowIndex][colIndex]
            const hasTile = tile !== null

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => onSquareClick?.(rowIndex, colIndex)}
                className={cx(
                  'flex aspect-square items-center justify-center',
                  squareType === 'DW' || squareType === 'TW' || squareType === 'ST'
                    ? 'bg-neutral-500'
                    : 'bg-neutral-200',
                  onSquareClick && 'cursor-pointer hover:opacity-80',
                  isSelected(rowIndex, colIndex) && 'ring-[0.15cqw] ring-blue-500 ring-inset'
                )}
              >
                {hasTile ? <Tile letter={tile} /> : renderSquareContent(squareType, rowIndex, colIndex)}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ScrabbleBoard
