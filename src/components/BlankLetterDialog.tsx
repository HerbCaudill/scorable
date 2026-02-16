import { useState, useEffect, useCallback } from "react"
import { IconBackspace } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tile } from "./Tile"
import { cx } from "@/lib/cx"

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
]

/**
 * Dialog for assigning letters to blank tiles after a move is committed.
 * Shows the word(s) with blanks as empty slots and accepts keyboard/tap input.
 * Letter buttons are rendered inline inside the dialog to avoid mobile Safari
 * issues with touch events being blocked by the dialog overlay.
 */
export const BlankLetterDialog = ({ open, blanks, onComplete, onCancel }: Props) => {
  // Track letters assigned to each blank position
  const [assignedLetters, setAssignedLetters] = useState<string[]>([])

  // Reset state when dialog opens with new blanks
  useEffect(() => {
    if (open) {
      setAssignedLetters([])
    }
  }, [open, blanks])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === "Backspace") {
        setAssignedLetters(prev => prev.slice(0, -1))
        return
      }

      if (key === "Enter") {
        if (assignedLetters.length === blanks.length) {
          onComplete(assignedLetters)
        }
        return
      }

      // Only accept letters, and only if there are more blanks to fill
      if (/^[a-zA-Z]$/.test(key) && assignedLetters.length < blanks.length) {
        setAssignedLetters(prev => [...prev, key.toUpperCase()])
      }
    },
    [assignedLetters, blanks.length, onComplete],
  )

  // Hardware keyboard listener
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === "Backspace" || e.key === "Enter" || /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault()
        handleKeyPress(e.key)
      }

      if (e.key === "Escape") {
        e.preventDefault()
        onCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, handleKeyPress, onCancel])

  const allFilled = assignedLetters.length === blanks.length

  const renderWordPreview = () => {
    let letterIndex = 0
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {blanks.map((_, i) => {
          const letter = assignedLetters[letterIndex]
          const isCurrent = i === assignedLetters.length
          letterIndex = i < assignedLetters.length ? letterIndex + 1 : letterIndex
          return (
            <div
              key={i}
              className="relative"
              style={{ width: "2.5rem", height: "2.5rem" }}
            >
              <Tile letter={letter ?? ""} variant="new" />
              {isCurrent && (
                <div className="absolute inset-0 ring-2 ring-teal-600 ring-inset pointer-events-none animate-pulse" />
              )}
              {!letter && !isCurrent && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-xl font-bold">
                  ?
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent showCloseButton={false} className="max-w-xs">
        <DialogHeader>
          <DialogTitle>
            {blanks.length === 1 ? "What letter is the blank?" : "What letters are the blanks?"}
          </DialogTitle>
          <DialogDescription>
            Tap the letter for your blank tile{blanks.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">{renderWordPreview()}</div>

        {/* Inline letter buttons - works reliably on all browsers including mobile Safari */}
        <div className="flex flex-col gap-1.5">
          {ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {row.map(letter => (
                <button
                  key={letter}
                  type="button"
                  className={cx(
                    "flex h-9 min-w-[9%] flex-1 max-w-9 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold",
                    "shadow-[0_2px_0_0_var(--color-neutral-300)] active:shadow-none active:translate-y-[2px]",
                    "touch-manipulation select-none",
                  )}
                  onClick={() => handleKeyPress(letter)}
                >
                  {letter}
                </button>
              ))}
              {rowIndex === 2 && (
                <button
                  type="button"
                  className={cx(
                    "ml-1 flex h-9 min-w-[9%] flex-1 max-w-9 items-center justify-center rounded-md bg-neutral-200 font-semibold",
                    "shadow-[0_2px_0_0_var(--color-neutral-400)] active:shadow-none active:translate-y-[2px]",
                    "touch-manipulation select-none",
                  )}
                  onClick={() => handleKeyPress("Backspace")}
                >
                  <IconBackspace size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onComplete(assignedLetters)} disabled={!allFilled}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type BlankPosition = {
  row: number
  col: number
}

type Props = {
  open: boolean
  /** Positions of unassigned blank tiles */
  blanks: BlankPosition[]
  /** Called with the assigned letters when user completes */
  onComplete: (letters: string[]) => void
  /** Called when user cancels */
  onCancel: () => void
}
