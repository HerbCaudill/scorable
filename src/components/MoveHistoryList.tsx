import { useState } from "react"
import type { MoveHistoryEntry } from "@/lib/getPlayerMoveHistory"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconPencil, IconAlertTriangle, IconX } from "@tabler/icons-react"

export type MoveAction = "correct" | "challenge"

export const MoveHistoryList = ({
  history,
  onMoveClick,
  onMoveAction,
  editingIndex,
  isLastMove,
  className,
}: Props) => {
  return (
    <div className={cn("flex flex-col divide-y divide-neutral-200", className)}>
      {history.map((entry, i) => {
        if (entry.isAdjustment) {
          // Display adjustment entry (not editable)
          const scoreClass =
            entry.score > 0 ? "text-green-600"
            : entry.score < 0 ? "text-red-600"
            : ""
          const scorePrefix = entry.score > 0 ? "+" : ""
          return (
            <div key={i} className="flex justify-between gap-2 px-1 py-1.5 text-neutral-500 italic">
              <span className="truncate">Final</span>
              <span className={cn("font-medium", scoreClass)}>
                {scorePrefix}
                {entry.score}
              </span>
            </div>
          )
        }

        if (entry.isFailedChallenge) {
          // Display failed challenge entry (not editable)
          const challengedWords = entry.failedChallengeWords?.map(w => w.toUpperCase()).join(", ")
          return (
            <div key={i} className="flex justify-between gap-2 px-1 py-1.5 text-red-600 italic">
              <span className="flex items-center gap-1 truncate">
                <IconX size={12} className="shrink-0" />
                <span>failed challenge{challengedWords ? `: ${challengedWords}` : ""}</span>
              </span>
              <span className="font-medium">0</span>
            </div>
          )
        }

        const isLast = isLastMove?.(i) ?? false

        return (
          <MoveHistoryEntry
            key={i}
            entry={entry}
            index={i}
            isEditing={editingIndex === i}
            isLastMove={isLast}
            onMoveClick={onMoveClick}
            onMoveAction={onMoveAction}
          />
        )
      })}
    </div>
  )
}

const MoveHistoryEntry = ({
  entry,
  index,
  isEditing,
  isLastMove,
  onMoveClick,
  onMoveAction,
}: MoveHistoryEntryProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleAction = (action: MoveAction) => {
    setDropdownOpen(false)
    onMoveAction?.(index, action)
  }

  // For passes (no tiles placed), don't show any actions
  const isPass = entry.tiles.length === 0

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "flex cursor-pointer justify-between gap-2 px-1 py-1.5 select-none hover:bg-neutral-100 active:bg-neutral-200",
            isEditing ? "bg-teal-100 text-teal-800 font-medium" : "text-neutral-600",
          )}
          onClick={() => onMoveClick(entry.tiles)}
        >
          <span className="truncate">
            {entry.words.length > 0 ?
              entry.words.join(", ")
            : <em className="text-neutral-400">(pass)</em>}
          </span>
          <span className="font-medium">{entry.score}</span>
        </div>
      </DropdownMenuTrigger>
      {!isPass && (
        <DropdownMenuContent align="start" side="bottom">
          <DropdownMenuItem onClick={() => handleAction("correct")}>
            <IconPencil size={16} />
            Correct
          </DropdownMenuItem>
          {isLastMove && (
            <DropdownMenuItem onClick={() => handleAction("challenge")}>
              <IconAlertTriangle size={16} />
              Challenge
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}

type Props = {
  history: MoveHistoryEntry[]
  onMoveClick: (tiles: Array<{ row: number; col: number }>) => void
  onMoveAction?: (playerMoveIndex: number, action: MoveAction) => void
  editingIndex?: number
  /** Function to check if a move at index is the last move in the game */
  isLastMove?: (playerMoveIndex: number) => boolean
  className?: string
}

type MoveHistoryEntryProps = {
  entry: MoveHistoryEntry
  index: number
  isEditing: boolean
  isLastMove: boolean
  onMoveClick: (tiles: Array<{ row: number; col: number }>) => void
  onMoveAction?: (playerMoveIndex: number, action: MoveAction) => void
}
