import { useState, useEffect, useCallback } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tile } from "./Tile"
import { MobileKeyboard } from "./MobileKeyboard"
import { cn } from "@/lib/utils"

/**
 * Dialog for assigning letters to blank tiles after a move is committed.
 * Shows the word(s) with blanks as empty slots and accepts keyboard input.
 */
export const BlankLetterDialog = ({ open, blanks, onComplete, onCancel }: Props) => {
  // Track letters assigned to each blank position
  const [assignedLetters, setAssignedLetters] = useState<string[]>([])
  const [isMobile] = useState(() => "ontouchstart" in window || navigator.maxTouchPoints > 0)

  // Reset state when dialog opens with new blanks
  useEffect(() => {
    if (open) {
      setAssignedLetters([])
    }
  }, [open, blanks])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === "Backspace") {
        // Remove last assigned letter
        setAssignedLetters(prev => prev.slice(0, -1))
        return
      }

      if (key === "Enter") {
        // Complete if all blanks are filled
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

  // Keyboard listener for desktop
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modifier keys are pressed
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

  // Build display showing the word(s) with blanks filled in
  const renderWordPreview = () => {
    // Group blanks by their word context for display
    // For now, just show the blanks with their assigned letters
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
              style={{
                width: "2.5rem",
                height: "2.5rem",
              }}
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
      {/* Manually compose the portal so the MobileKeyboard is inside it,
          ensuring it shares the same stacking context as the dialog overlay */}
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-80 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg",
            "max-w-xs",
          )}
          onPointerDownOutside={e => e.preventDefault()}
          onInteractOutside={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {blanks.length === 1 ? "What letter is the blank?" : "What letters are the blanks?"}
            </DialogTitle>
            <DialogDescription>
              Type the letter{blanks.length > 1 ? "s" : ""} for your blank tile
              {blanks.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">{renderWordPreview()}</div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onComplete(assignedLetters)} disabled={!allFilled}>
              Done
            </Button>
          </div>

          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>

        {/* Mobile keyboard inside the portal - shares stacking context with overlay */}
        {isMobile && (
          <div className="fixed inset-x-0 bottom-0 z-[100]">
            <MobileKeyboard onKeyPress={handleKeyPress} direction="horizontal" visible={true} />
          </div>
        )}
      </DialogPortal>
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
