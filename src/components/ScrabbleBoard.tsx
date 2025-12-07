import { useCallback, useEffect, useRef, useState } from 'react'
import { boardLayout } from '@/lib/boardLayout'
import { type SquareType, type BoardState } from '@/lib/types'
import { createEmptyBoard } from '@/lib/createEmptyBoard'
import { tileValues } from '@/lib/tileValues'
import { getTileValue } from '@/lib/getTileValue'
import { cx } from '@/lib/cx'

const ScrabbleBoard = ({ tiles: externalTiles, onTilesChange, editable = false }: Props) => {
  const [internalTiles, setInternalTiles] = useState<BoardState>(createEmptyBoard)
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // Use external tiles if provided (controlled mode), otherwise internal state
  const tiles = externalTiles ?? internalTiles

  const setTiles = useCallback(
    (newTiles: BoardState | ((prev: BoardState) => BoardState)) => {
      if (onTilesChange) {
        const resolved = typeof newTiles === 'function' ? newTiles(tiles) : newTiles
        onTilesChange(resolved)
      } else {
        setInternalTiles(newTiles)
      }
    },
    [onTilesChange, tiles]
  )

  // Handle square click - set cursor position
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (!editable) return

      // If clicking on the current cursor position, toggle direction
      if (cursor && cursor.row === row && cursor.col === col) {
        setCursor({
          ...cursor,
          direction: cursor.direction === 'horizontal' ? 'vertical' : 'horizontal',
        })
      } else {
        // Set cursor to clicked position
        setCursor({ row, col, direction: cursor?.direction ?? 'horizontal' })
      }

      // Focus the board for keyboard input
      boardRef.current?.focus()
    },
    [editable, cursor]
  )

  // Find next empty position in current direction
  const findNextPosition = useCallback(
    (fromRow: number, fromCol: number, direction: CursorDirection, skipExisting: boolean): Cursor | null => {
      let row = fromRow
      let col = fromCol

      if (direction === 'horizontal') {
        col++
        while (col < 15) {
          if (!skipExisting || tiles[row][col] === null) {
            return { row, col, direction }
          }

          col++
        }
      } else {
        row++
        while (row < 15) {
          if (!skipExisting || tiles[row][col] === null) {
            return { row, col, direction }
          }

          row++
        }
      }

      return null // Off the board
    },
    [tiles]
  )

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!editable || !cursor) return

      // Stop propagation to prevent Storybook shortcuts from triggering
      event.stopPropagation()

      const { key } = event

      // Handle backspace - delete current tile and move back
      if (key === 'Backspace') {
        event.preventDefault()
        const { row, col, direction } = cursor

        // If current cell has a tile, just delete it
        if (tiles[row][col] !== null) {
          setTiles(prev => {
            const newTiles = prev.map(r => [...r])
            newTiles[row][col] = null
            return newTiles
          })
        } else {
          // Move back and delete previous tile
          const prevRow = direction === 'vertical' ? row - 1 : row
          const prevCol = direction === 'horizontal' ? col - 1 : col

          if (prevRow >= 0 && prevCol >= 0) {
            setTiles(prev => {
              const newTiles = prev.map(r => [...r])
              newTiles[prevRow][prevCol] = null
              return newTiles
            })
            setCursor({ row: prevRow, col: prevCol, direction })
          }
        }

        return
      }

      // Handle arrow keys for cursor movement
      if (key === 'ArrowUp' && cursor.row > 0) {
        event.preventDefault()
        setCursor({ ...cursor, row: cursor.row - 1 })
        return
      }

      if (key === 'ArrowDown' && cursor.row < 14) {
        event.preventDefault()
        setCursor({ ...cursor, row: cursor.row + 1 })
        return
      }

      if (key === 'ArrowLeft' && cursor.col > 0) {
        event.preventDefault()
        setCursor({ ...cursor, col: cursor.col - 1 })
        return
      }

      if (key === 'ArrowRight' && cursor.col < 14) {
        event.preventDefault()
        setCursor({ ...cursor, col: cursor.col + 1 })
        return
      }

      // Handle space for blank tile
      if (key === ' ') {
        event.preventDefault()
        const { row, col, direction } = cursor

        // Place blank tile
        setTiles(prev => {
          const newTiles = prev.map(r => [...r])
          newTiles[row][col] = ' '
          return newTiles
        })

        // Move to next position, skipping existing tiles
        const next = findNextPosition(row, col, direction, true)
        if (next) {
          setCursor(next)
        }

        return
      }

      // Handle letter input
      const letter = key.toUpperCase()
      if (letter.length === 1 && letter in tileValues && letter !== ' ') {
        event.preventDefault()
        const { row, col, direction } = cursor

        // Place the letter
        setTiles(prev => {
          const newTiles = prev.map(r => [...r])
          newTiles[row][col] = letter
          return newTiles
        })

        // Move to next position, skipping existing tiles
        const next = findNextPosition(row, col, direction, true)
        if (next) {
          setCursor(next)
        }
      }
    },
    [editable, cursor, tiles, setTiles, findNextPosition]
  )

  // Focus board when cursor is set
  useEffect(() => {
    if (cursor && boardRef.current) {
      boardRef.current.focus()
    }
  }, [cursor])

  const isCursorAt = (row: number, col: number) => cursor?.row === row && cursor?.col === col
  // Dots component for multipliers - sized relative to container
  const Dots = ({ count, light = false, rotation }: { count: number; light?: boolean; rotation: string }) => {
    return (
      <div className={cx('flex gap-[0.9cqw]', rotation)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cx('size-[0.8cqw] rounded-full', light ? 'bg-khaki-800' : 'bg-white')} />
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
      <div className="relative flex h-full w-full items-center justify-center rounded-[0.2cqw] bg-amber-100 shadow-sm z-0">
        <span className="text-[3.5cqw] font-bold text-khaki-800 leading-none">
          {letter === ' ' ? '' : letter.toUpperCase()}
        </span>
        <span className="absolute bottom-[0.2cqw] right-[0.4cqw] text-[1.6cqw] font-semibold text-khaki-600 leading-none">
          {value > 0 ? value : ''}
        </span>
      </div>
    )
  }

  // Cursor arrow component - triangle positioned outside the box
  const CursorArrow = ({ direction }: { direction: CursorDirection }) => (
    <div
      className={cx(
        'absolute w-0 h-0 border-solid z-20',
        direction === 'horizontal'
          ? // Right-pointing triangle, positioned to the right of the box
            'left-full top-1/2 -translate-y-1/2  border-t-[1.2cqw] border-b-[1.2cqw] border-l-[1.5cqw] border-t-transparent border-b-transparent border-l-teal-600'
          : // Down-pointing triangle, positioned below the box
            'top-full left-1/2 -translate-x-1/2  border-l-[1.2cqw] border-r-[1.2cqw] border-t-[1.5cqw] border-l-transparent border-r-transparent border-t-teal-600'
      )}
    />
  )

  return (
    <div
      ref={boardRef}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className="@container w-full max-w-2xl outline-none"
    >
      <div className="grid w-full aspect-square grid-cols-15 gap-[0.25cqw] bg-khaki-300 p-[0.25cqw]">
        {boardLayout.map((row, rowIndex) =>
          row.map((squareType, colIndex) => {
            const tile = tiles[rowIndex][colIndex]
            const hasTile = tile !== null
            const hasCursor = isCursorAt(rowIndex, colIndex)

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                className={cx(
                  'relative flex aspect-square items-center justify-center overflow-visible',
                  squareType === 'DW' || squareType === 'TW' || squareType === 'ST' ? 'bg-khaki-500' : 'bg-khaki-200',
                  editable && 'cursor-pointer hover:opacity-80',
                  hasCursor && 'z-10'
                )}
              >
                {hasTile ? <Tile letter={tile} /> : renderSquareContent(squareType, rowIndex, colIndex)}
                {hasCursor && (
                  <>
                    <div className="absolute inset-0 ring-[0.4cqw] ring-teal-600 ring-inset pointer-events-none z-10" />
                    {cursor && <CursorArrow direction={cursor.direction} />}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ScrabbleBoard

type CursorDirection = 'horizontal' | 'vertical'

type Cursor = {
  row: number
  col: number
  direction: CursorDirection
}

type Props = {
  /** The current state of tiles on the board */
  tiles?: BoardState
  /** Callback when tiles are changed (for controlled mode) */
  onTilesChange?: (tiles: BoardState) => void
  /** Whether the board is in editing mode */
  editable?: boolean
}
