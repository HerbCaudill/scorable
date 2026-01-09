import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { boardLayout } from '@/lib/boardLayout'
import { type SquareType, type BoardState } from '@/lib/types'
import { createEmptyBoard } from '@/lib/createEmptyBoard'
import { tileValues } from '@/lib/tileValues'
import { cx } from '@/lib/cx'
import { Tile } from './Tile'
import { calculateMoveScore } from '@/lib/calculateMoveScore'
import { boardStateToMove } from '@/lib/boardStateToMove'

const ScrabbleBoard = ({
  tiles,
  newTiles: externalNewTiles,
  onNewTilesChange,
  editable = false,
  highlightedTiles = [],
  onEnter,
  onKeyPress,
  onCursorChange,
  useNativeKeyboard = true,
}: Props) => {
  const [internalNewTiles, setInternalNewTiles] = useState<BoardState>(createEmptyBoard)
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  // Use external newTiles if provided (controlled mode), otherwise internal state
  const newTiles = externalNewTiles ?? internalNewTiles

  const setNewTiles = useCallback(
    (updatedTiles: BoardState | ((prev: BoardState) => BoardState)) => {
      if (onNewTilesChange) {
        const resolved = typeof updatedTiles === 'function' ? updatedTiles(newTiles) : updatedTiles
        onNewTilesChange(resolved)
      } else {
        setInternalNewTiles(updatedTiles)
      }
    },
    [onNewTilesChange, newTiles]
  )

  // Determine the best cursor direction based on surrounding tiles
  const inferCursorDirection = useCallback(
    (row: number, col: number): CursorDirection => {
      if (!tiles) return cursor?.direction ?? 'horizontal'

      // Find closest tile in each direction
      let closestLeft = Infinity
      let closestRight = Infinity
      let closestAbove = Infinity
      let closestBelow = Infinity

      // Scan left
      for (let c = col - 1; c >= 0; c--) {
        if (tiles[row][c] !== null) {
          closestLeft = col - c
          break
        }
      }
      // Scan right
      for (let c = col + 1; c < 15; c++) {
        if (tiles[row][c] !== null) {
          closestRight = c - col
          break
        }
      }
      // Scan above
      for (let r = row - 1; r >= 0; r--) {
        if (tiles[r][col] !== null) {
          closestAbove = row - r
          break
        }
      }
      // Scan below
      for (let r = row + 1; r < 15; r++) {
        if (tiles[r][col] !== null) {
          closestBelow = r - row
          break
        }
      }

      const closestHorizontal = Math.min(closestLeft, closestRight)
      const closestVertical = Math.min(closestAbove, closestBelow)

      // If only one direction has tiles, use that
      if (closestVertical < Infinity && closestHorizontal === Infinity) {
        return 'vertical'
      }
      if (closestHorizontal < Infinity && closestVertical === Infinity) {
        return 'horizontal'
      }
      // Both directions have tiles: prefer the closer one
      if (closestVertical < closestHorizontal) {
        return 'vertical'
      }
      if (closestHorizontal < closestVertical) {
        return 'horizontal'
      }
      // Equal distance or no tiles: keep current direction or default to horizontal
      return cursor?.direction ?? 'horizontal'
    },
    [tiles, cursor?.direction]
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
        // Set cursor to clicked position with intelligently inferred direction
        const direction = inferCursorDirection(row, col)
        setCursor({ row, col, direction })
      }

      // Focus the hidden input for keyboard input (only when using native keyboard)
      if (useNativeKeyboard) {
        hiddenInputRef.current?.focus()
      }
    },
    [editable, cursor, inferCursorDirection, useNativeKeyboard]
  )

  // Combined view of all tiles (existing + new)
  const allTiles = tiles
    ? tiles.map((row, rowIndex) => row.map((tile, colIndex) => newTiles[rowIndex][colIndex] ?? tile))
    : newTiles

  // Find next empty position in current direction
  // When skipExisting is true, skip cells that have tiles in the base `tiles` prop (not newTiles)
  // This allows cursor to advance over pre-populated newTiles when editing a move
  const findNextPosition = useCallback(
    (fromRow: number, fromCol: number, direction: CursorDirection, skipExisting: boolean): Cursor | null => {
      let row = fromRow
      let col = fromCol

      if (direction === 'horizontal') {
        col++
        while (col < 15) {
          // Only skip cells with existing tiles (from `tiles` prop), not newTiles
          if (!skipExisting || !tiles || tiles[row][col] === null) {
            return { row, col, direction }
          }

          col++
        }
      } else {
        row++
        while (row < 15) {
          // Only skip cells with existing tiles (from `tiles` prop), not newTiles
          if (!skipExisting || !tiles || tiles[row][col] === null) {
            return { row, col, direction }
          }

          row++
        }
      }

      return null // Off the board
    },
    [tiles]
  )

  // Process a key press (shared by keyboard events and external onKeyPress)
  const processKey = useCallback(
    (key: string) => {
      if (!editable || !cursor) return

      // Handle backspace - delete current tile and move back
      if (key === 'Backspace') {
        const { row, col, direction } = cursor

        // If current cell has a new tile, just delete it
        if (newTiles[row][col] !== null) {
          setNewTiles(prev => {
            const updated = prev.map(r => [...r])
            updated[row][col] = null
            return updated
          })
        } else {
          // Move back and delete previous tile
          const prevRow = direction === 'vertical' ? row - 1 : row
          const prevCol = direction === 'horizontal' ? col - 1 : col

          if (prevRow >= 0 && prevCol >= 0 && newTiles[prevRow][prevCol] !== null) {
            setNewTiles(prev => {
              const updated = prev.map(r => [...r])
              updated[prevRow][prevCol] = null
              return updated
            })
            setCursor({ row: prevRow, col: prevCol, direction })
          }
        }

        return
      }

      // Handle arrow keys for cursor movement
      if (key === 'ArrowUp' && cursor.row > 0) {
        setCursor({ ...cursor, row: cursor.row - 1 })
        return
      }

      if (key === 'ArrowDown' && cursor.row < 14) {
        setCursor({ ...cursor, row: cursor.row + 1 })
        return
      }

      if (key === 'ArrowLeft' && cursor.col > 0) {
        setCursor({ ...cursor, col: cursor.col - 1 })
        return
      }

      if (key === 'ArrowRight' && cursor.col < 14) {
        setCursor({ ...cursor, col: cursor.col + 1 })
        return
      }

      // Handle space for blank tile
      if (key === ' ') {
        const { row, col, direction } = cursor

        // Don't place tile on existing tile
        if (tiles && tiles[row][col] !== null) return

        // Place blank tile
        setNewTiles(prev => {
          const updated = prev.map(r => [...r])
          updated[row][col] = ' '
          return updated
        })

        // Move to next position, skipping existing tiles
        const next = findNextPosition(row, col, direction, true)
        if (next) {
          setCursor(next)
        }

        return
      }

      // Handle Enter key to end turn
      if (key === 'Enter') {
        setCursor(null) // Clear cursor to hide keyboard
        onEnter?.()
        return
      }

      // Handle direction toggle (for mobile keyboard)
      if (key === 'ToggleDirection') {
        setCursor({
          ...cursor,
          direction: cursor.direction === 'horizontal' ? 'vertical' : 'horizontal',
        })
        return
      }

      // Handle letter input
      // Single letter keys that are valid Scrabble tiles
      if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
        const letter = key.toUpperCase()
        if (letter in tileValues) {
          const { row, col, direction } = cursor

          // Don't place tile on existing tile
          if (tiles && tiles[row][col] !== null) return

          // Place the letter
          setNewTiles(prev => {
            const updated = prev.map(r => [...r])
            updated[row][col] = letter
            return updated
          })

          // Move to next position, skipping existing tiles
          const next = findNextPosition(row, col, direction, true)
          if (next) {
            setCursor(next)
          }
        }
        return
      }
    },
    [editable, cursor, tiles, newTiles, setNewTiles, findNextPosition, onEnter]
  )

  // Handle keyboard input from the hidden input
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!editable || !cursor) return

      // Stop propagation to prevent Storybook shortcuts from triggering
      event.stopPropagation()

      // Only handle non-letter keys here (letters are handled by onInput for iOS compatibility)
      const key = event.key
      if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
        // Let onInput handle letters
        return
      }

      event.preventDefault()
      processKey(key)
    },
    [editable, cursor, processKey]
  )

  // Handle text input for letter keys (more compatible with iOS virtual keyboard)
  const handleInput = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      if (!editable || !cursor) return

      const input = event.currentTarget
      const value = input.value.toUpperCase()

      // Clear the input immediately
      input.value = ''

      // Process only the last character if multiple were typed
      const letter = value.slice(-1)
      if (letter.length === 1 && /^[A-Z]$/.test(letter)) {
        processKey(letter)
      }
    },
    [editable, cursor, processKey]
  )

  // Store processKey in a ref so we can access the latest version without re-renders
  const processKeyRef = useRef(processKey)
  processKeyRef.current = processKey

  // Expose a stable wrapper function to parent via onKeyPress callback
  useEffect(() => {
    if (onKeyPress) {
      // Pass a stable function that calls the ref's current value
      onKeyPress((key: string) => processKeyRef.current(key))
    }
  }, [onKeyPress]) // Only depends on onKeyPress, not processKey

  // Notify parent when cursor changes
  useEffect(() => {
    onCursorChange?.(cursor !== null, cursor?.direction ?? 'horizontal')
  }, [cursor, onCursorChange])


  // Focus hidden input when cursor is set (only when using native keyboard)
  useEffect(() => {
    if (useNativeKeyboard && cursor && hiddenInputRef.current) {
      hiddenInputRef.current.focus()
    }
  }, [cursor, useNativeKeyboard])

  const isCursorAt = (row: number, col: number) => cursor?.row === row && cursor?.col === col
  const isHighlighted = (row: number, col: number) =>
    highlightedTiles.some(t => t.row === row && t.col === col)

  // Calculate the current move score
  const currentMoveScore = useMemo(() => {
    const move = boardStateToMove(newTiles)
    if (move.length === 0) return null
    const board = tiles ?? createEmptyBoard()
    return calculateMoveScore({ move, board })
  }, [newTiles, tiles])
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

  // Score badge component - shows current move score at cursor
  const ScoreBadge = ({ score }: { score: number }) => (
    <div className="absolute -top-[1cqw] -right-[1cqw] z-30 bg-teal-600 text-white text-[2cqw] font-bold rounded-full min-w-[4cqw] h-[4cqw] flex items-center justify-center px-[0.8cqw] shadow-md">
      {score}
    </div>
  )

  // Convert column index to letter (A-O)
  const colToLetter = (col: number) => String.fromCharCode(65 + col)

  return (
    <div
      ref={boardRef}
      className="@container w-full outline-none relative p-1"
      role="grid"
      aria-label="Scrabble board"
    >
      {/* Hidden input to capture keyboard events - positioned off-screen but visible for better webkit compatibility */}
      {editable && (
        <input
          ref={hiddenInputRef}
          type="text"
          enterKeyHint="go"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="absolute -left-[9999px] top-0 w-px h-px opacity-1"
          style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <div className="grid w-full aspect-square grid-cols-15 gap-[0.25cqw] bg-khaki-300 p-[0.25cqw]">
        {boardLayout.map((row, rowIndex) =>
          row.map((squareType, colIndex) => {
            const tile = allTiles[rowIndex][colIndex]
            const hasTile = tile !== null
            const isNewTile = newTiles[rowIndex][colIndex] !== null
            const hasCursor = isCursorAt(rowIndex, colIndex)
            const highlighted = isHighlighted(rowIndex, colIndex)
            const cellLabel = `${colToLetter(colIndex)}${rowIndex + 1}`

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                role="gridcell"
                aria-label={cellLabel}
                aria-selected={hasCursor}
                data-has-tile={hasTile || undefined}
                data-tile-state={isNewTile ? 'new' : hasTile ? 'existing' : undefined}
                data-cursor-direction={hasCursor ? cursor?.direction : undefined}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                className={cx(
                  'relative flex aspect-square items-center justify-center overflow-visible',
                  squareType === 'DW' || squareType === 'TW' || squareType === 'ST' ? 'bg-khaki-500' : 'bg-khaki-200',
                  editable && 'cursor-pointer hover:opacity-80',
                  hasCursor && 'z-10'
                )}
              >
                {hasTile ? (
                  <Tile letter={tile} variant={isNewTile ? 'new' : 'existing'} />
                ) : (
                  renderSquareContent(squareType, rowIndex, colIndex)
                )}
                {hasCursor && (
                  <>
                    <div className="absolute inset-0 ring-[0.4cqw] ring-teal-600 ring-inset pointer-events-none z-10" />
                    {cursor && <CursorArrow direction={cursor.direction} />}
                    {currentMoveScore !== null && <ScoreBadge score={currentMoveScore} />}
                  </>
                )}
                {highlighted && (
                  <div className="absolute inset-0 ring-[0.4cqw] ring-orange-500 ring-inset pointer-events-none z-10 animate-highlight-fade" />
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
  /** Pre-existing tiles on the board (displayed in amber) */
  tiles?: BoardState
  /** New tiles being placed in the current turn (displayed in teal) */
  newTiles?: BoardState
  /** Callback when new tiles are changed (for controlled mode) */
  onNewTilesChange?: (tiles: BoardState) => void
  /** Whether the board is in editing mode */
  editable?: boolean
  /** Tiles to highlight (e.g., when showing a past move) */
  highlightedTiles?: Array<{ row: number; col: number }>
  /** Callback when Enter key is pressed */
  onEnter?: () => void
  /** Callback that receives the key handler function for external keyboards */
  onKeyPress?: (handler: (key: string) => void) => void
  /** Callback when cursor changes (appears/disappears or direction changes) */
  onCursorChange?: (hasCursor: boolean, direction: 'horizontal' | 'vertical') => void
  /** Whether to use native keyboard (focus hidden input). Set to false for custom keyboard. */
  useNativeKeyboard?: boolean
}
