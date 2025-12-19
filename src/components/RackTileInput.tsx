import { useRef, useEffect } from 'react'
import { Tile } from './Tile'
import { cx } from '@/lib/cx'

export const RackTileInput = ({
  tiles,
  onChange,
  playerColor,
  disabled = false,
  error,
  deduction,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle keyboard input
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond if this component is focused
      if (!containerRef.current?.contains(document.activeElement)) return

      if (e.key === 'Backspace') {
        e.preventDefault()
        if (tiles.length > 0) {
          onChange(tiles.slice(0, -1))
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        onChange([...tiles, ' ']) // blank tile
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault()
        onChange([...tiles, e.key.toUpperCase()])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [tiles, onChange, disabled])

  const handleFocus = () => {
    containerRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        onClick={handleFocus}
        className={cx(
          'flex min-h-10 cursor-text items-center gap-1 rounded-lg border-2 px-2 py-1 outline-none transition-colors',
          disabled ? 'cursor-default bg-neutral-100' : 'focus:ring-2 focus:ring-offset-1',
          error ? 'border-red-400' : 'border-neutral-300'
        )}
        style={{
          '--ring-color': playerColor,
          focusRing: `var(--ring-color)`,
        } as React.CSSProperties}
      >
        {tiles.length === 0 && !disabled && (
          <span className="text-sm text-neutral-400">Type letters...</span>
        )}
        {tiles.length === 0 && disabled && (
          <span className="text-sm text-neutral-400">No tiles</span>
        )}
        {tiles.map((tile, index) => (
          <div key={index} className="h-8 w-8">
            <Tile letter={tile} variant="existing" />
          </div>
        ))}

        {/* Deduction display */}
        {deduction !== undefined && deduction !== 0 && (
          <span
            className={cx(
              'ml-auto text-lg font-bold tabular-nums',
              deduction > 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {deduction > 0 ? '+' : ''}
            {deduction}
          </span>
        )}
      </div>

      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}

type Props = {
  tiles: string[]
  onChange: (tiles: string[]) => void
  playerColor: string
  disabled?: boolean
  error?: string
  deduction?: number
}
