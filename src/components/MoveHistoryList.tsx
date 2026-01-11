import { useState } from "react"
import type { MoveHistoryEntry } from "@/lib/getPlayerMoveHistory"
import type { WordWithBlankInfo } from "@/lib/getWordsFromMove"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconPencil, IconAlertTriangle, IconX, IconEye } from "@tabler/icons-react"
import { useLongPress } from "@/lib/useLongPress"

export type MoveAction = "correct" | "challenge" | "check"

/** Render a word with blank letters at 25% opacity */
const WordWithBlanks = ({ wordInfo }: { wordInfo: WordWithBlankInfo }) => {
  const { word, blankIndices } = wordInfo
  const blankSet = new Set(blankIndices)

  return (
    <span>
      {word.split("").map((char, i) => (
        <span key={i} className={blankSet.has(i) ? "opacity-25" : ""}>
          {char}
        </span>
      ))}
    </span>
  )
}

/** Render words list with blanks shown at 25% opacity */
const WordsDisplay = ({ entry }: { entry: MoveHistoryEntry }) => {
  if (entry.words.length === 0) {
    return <em className="text-neutral-400">(pass)</em>
  }

  // Use wordsWithBlanks if available for proper blank rendering
  if (entry.wordsWithBlanks && entry.wordsWithBlanks.length > 0) {
    return (
      <>
        {entry.wordsWithBlanks.map((wordInfo, i) => (
          <span key={i}>
            {i > 0 && ", "}
            <WordWithBlanks wordInfo={wordInfo} />
          </span>
        ))}
      </>
    )
  }

  // Fallback to simple display
  return <>{entry.words.join(", ")}</>
}

function getScoreColorClass(score: number): string {
  if (score > 0) return "text-green-600"
  if (score < 0) return "text-red-600"
  return ""
}

export const MoveHistoryList = ({
  history,
  onMoveClick,
  onMoveAction,
  editingIndex,
  isLastMove,
  disableActions,
  className,
}: Props) => {
  return (
    <div className={cn("flex flex-col divide-y divide-neutral-200", className)}>
      {history.map((entry, i) => {
        if (entry.isAdjustment) {
          // Display adjustment entry (not editable)
          const scoreClass = getScoreColorClass(entry.score)
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

        if (entry.isSuccessfulChallenge) {
          // Display successful challenge entry - shows rejected words with strikethrough
          const rejectedWords = entry.successfulChallengeWords?.map(w => w.toUpperCase()).join(", ")
          return (
            <div key={i} className="flex justify-between gap-2 px-1 py-1.5 text-neutral-400 italic">
              <span className="flex items-center gap-1 truncate">
                <IconX size={12} className="shrink-0" />
                <span className="line-through">{rejectedWords || "(rejected)"}</span>
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
            disableActions={disableActions}
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
  disableActions,
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

  // Disable long-press when actions are disabled or for passes
  const enableLongPress = !disableActions && !isPass

  const longPressHandlers = useLongPress(() => {
    if (enableLongPress) {
      setDropdownOpen(true)
    }
  }, enableLongPress)

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild disabled>
        <div
          {...longPressHandlers()}
          className={cn(
            "flex cursor-pointer justify-between gap-2 px-1 py-1.5 select-none hover:bg-neutral-100 active:bg-neutral-200 touch-pan-y",
            isEditing ? "bg-teal-100 text-teal-800 font-medium" : "text-neutral-600",
          )}
          onClick={() => onMoveClick(entry.tiles)}
        >
          <span className="truncate">
            <WordsDisplay entry={entry} />
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
          <DropdownMenuItem onClick={() => handleAction("check")}>
            <IconEye size={16} />
            Check
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
  /** Disable all dropdown actions (for past games view) */
  disableActions?: boolean
  className?: string
}

type MoveHistoryEntryProps = {
  entry: MoveHistoryEntry
  index: number
  disableActions?: boolean
  isEditing: boolean
  isLastMove: boolean
  onMoveClick: (tiles: Array<{ row: number; col: number }>) => void
  onMoveAction?: (playerMoveIndex: number, action: MoveAction) => void
}
