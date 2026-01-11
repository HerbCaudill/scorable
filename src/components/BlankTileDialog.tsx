import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export const BlankTileDialog = ({ open, onSelect, onCancel }: Props) => {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  const handleSelect = (letter: string) => {
    setSelectedLetter(letter)
  }

  const handleConfirm = () => {
    if (selectedLetter) {
      onSelect(selectedLetter.toLowerCase()) // lowercase = blank tile
      setSelectedLetter(null)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedLetter(null)
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Choose a letter</DialogTitle>
          <DialogDescription>Select the letter this blank tile represents</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-7 gap-1.5">
          {LETTERS.map(letter => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? "default" : "outline"}
              size="sm"
              className="h-9 w-9 p-0 text-base font-bold"
              onClick={() => handleSelect(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedLetter}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type Props = {
  open: boolean
  onSelect: (letter: string) => void
  onCancel: () => void
}
