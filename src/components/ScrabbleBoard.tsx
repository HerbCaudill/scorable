import { BOARD_LAYOUT, type SquareType, type BoardState, type Tile, createEmptyBoard, createTile } from '../lib/board'
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
  // Dots component for multipliers
  const Dots = ({ count, light = false, rotation }: { count: number; light: boolean; rotation: string }) => {
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
        return <Dots count={2} rotation={rotation} />
      case 'TW':
        return <Dots count={3} rotation={rotation} />
      case 'ST':
        return <BullsEye />
      default:
        return null
    }
  }

  // Tile component to display placed tiles
  const TileDisplay = ({ tile }: { tile: Tile }) => (
    <div className="relative flex h-full w-full items-center justify-center rounded-sm bg-amber-100 shadow-sm">
      <span className="text-lg font-bold text-neutral-800">{tile.letter}</span>
      <span className="absolute bottom-0.5 right-1 text-[8px] font-semibold text-neutral-600">
        {tile.value > 0 ? tile.value : ''}
      </span>
    </div>
  )

  const isSelected = (row: number, col: number) => selectedSquare?.row === row && selectedSquare?.col === col

  return (
    <div className="grid grid-cols-15 gap-px bg-neutral-300 p-px">
      {BOARD_LAYOUT.map((row, rowIndex) =>
        row.map((squareType, colIndex) => {
          const tile = tiles[rowIndex][colIndex]
          const hasTile = tile !== null

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => onSquareClick?.(rowIndex, colIndex)}
              className={cx(
                'flex h-10 w-10 items-center justify-center p-0.5',
                squareType === 'DW' || squareType === 'TW' || squareType === 'ST' ? 'bg-neutral-800' : 'bg-white',
                onSquareClick && 'cursor-pointer hover:opacity-80',
                isSelected(rowIndex, colIndex) && 'ring-2 ring-blue-500 ring-inset'
              )}
            >
              {hasTile ? <TileDisplay tile={tile} /> : renderSquareContent(squareType, rowIndex, colIndex)}
            </div>
          )
        })
      )}
    </div>
  )
}

export default ScrabbleBoard
