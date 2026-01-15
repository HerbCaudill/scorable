import { useRef, useEffect } from "react"
import { Tile } from "./Tile"
import { cx } from "@/lib/cx"
import type { RackValidationError } from "@/lib/validateRackTiles"

export const RackTileInput = ({
  tiles,
  onChange,
  playerColor,
  disabled = false,
  error,
  deduction,
  isFocused = false,
  onFocusChange,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle keyboard events for desktop
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (e.key === "Backspace") {
      e.preventDefault()
      if (tiles.length > 0) {
        onChange(tiles.slice(0, -1))
      }
    } else if (e.key === " ") {
      e.preventDefault()
      onChange([...tiles, " "]) // blank tile
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault()
      onChange([...tiles, e.key.toUpperCase()])
    }
  }

  const handleClick = () => {
    if (disabled) return
    onFocusChange?.(true)
    containerRef.current?.focus()
  }

  // Focus the element when isFocused becomes true (for desktop keyboard support)
  useEffect(() => {
    if (isFocused && containerRef.current) {
      containerRef.current.focus()
    }
  }, [isFocused])

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onBlur={() => onFocusChange?.(false)}
        className={cx(
          "flex min-h-10 cursor-text items-center gap-1 rounded-lg border-2 px-2 py-1 outline-none transition-colors",
          disabled ? "cursor-default bg-neutral-100" : "",
          error ? "border-red-400" : isFocused ? "border-teal-500" : "border-neutral-300",
        )}
        style={
          {
            "--ring-color": playerColor,
          } as React.CSSProperties
        }
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

        {/* Blinking cursor when focused */}
        {isFocused && !disabled && (
          <div className="h-6 w-0.5 animate-blink bg-teal-500" />
        )}

        {/* Deduction display */}
        {deduction !== undefined && deduction !== 0 && (
          <span
            className={cx(
              "ml-auto text-lg font-bold tabular-nums",
              deduction > 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {deduction > 0 ? "+" : ""}
            {deduction}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-600">
          <div className="h-5 w-5 flex-shrink-0">
            <Tile letter={error.tile === " " ? " " : error.tile} variant="existing" />
          </div>
          <span>
            {error.available === 0
              ? "none left"
              : `${error.entered} entered, but only ${error.available} left`}
          </span>
        </div>
      )}
    </div>
  )
}

type Props = {
  tiles: string[]
  onChange: (tiles: string[]) => void
  playerColor: string
  disabled?: boolean
  error?: RackValidationError
  deduction?: number
  isFocused?: boolean
  onFocusChange?: (focused: boolean) => void
}
