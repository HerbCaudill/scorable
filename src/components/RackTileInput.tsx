import { useRef, useEffect, useState } from "react"
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
  onTileDrop,
  onTileDragStart,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

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

  // Clear selected tile when focus changes or tiles change
  useEffect(() => {
    if (!isFocused) {
      setSelectedTileIndex(null)
    }
  }, [isFocused])

  // Handle clicking on a tile to select it
  const handleTileClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering container click
    if (disabled) return
    // Always focus the input when clicking a tile
    onFocusChange?.(true)
    containerRef.current?.focus()
    // Toggle selection of this tile
    setSelectedTileIndex(prev => (prev === index ? null : index))
  }

  // Handle clicking the X button to remove the tile
  const handleRemoveTile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering tile click or container click
    const newTiles = [...tiles]
    newTiles.splice(index, 1)
    onChange(newTiles)
    setSelectedTileIndex(null)
  }

  // Drag-and-drop handlers
  const handleDragStart = (index: number, e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", tiles[index])
    e.dataTransfer.setData("application/x-rack-tile", JSON.stringify({ tile: tiles[index], index }))
    e.dataTransfer.effectAllowed = "move"
    onTileDragStart?.(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only handle drag leave if we're actually leaving the container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragOver(false)

    const tile = e.dataTransfer.getData("text/plain")
    if (!tile) return

    // Check if this is coming from another rack (has the rack-tile data)
    const rackTileData = e.dataTransfer.getData("application/x-rack-tile")
    if (rackTileData) {
      // Use onTileDrop to notify parent, which handles removing from source
      onTileDrop?.(tile)
    } else {
      // Coming from remaining tiles, just add it
      onChange([...tiles, tile])
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onBlur={() => onFocusChange?.(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cx(
          "flex min-h-10 cursor-text items-center gap-1 rounded-lg border-2 px-2 py-1 outline-none transition-colors",
          disabled ? "cursor-default bg-neutral-100" : "",
          error ? "border-red-400"
          : isDragOver ? "border-teal-500 bg-teal-50"
          : isFocused ? "border-teal-500"
          : "border-neutral-300",
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
          <div
            key={index}
            draggable={!disabled}
            onDragStart={e => handleDragStart(index, e)}
            className={cx("relative h-8 w-8", disabled ? "" : "cursor-grab active:cursor-grabbing")}
            onClick={e => handleTileClick(index, e)}
          >
            <Tile letter={tile} variant="existing" />
            {/* X icon overlay when tile is selected */}
            {selectedTileIndex === index && (
              <button
                className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600"
                onClick={e => handleRemoveTile(index, e)}
                aria-label={`Remove ${tile === " " ? "blank" : tile} tile`}
                data-testid="remove-tile-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
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
  onTileDrop?: (tile: string) => void
  onTileDragStart?: (tileIndex: number) => void
}
