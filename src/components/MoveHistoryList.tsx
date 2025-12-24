import type { MoveHistoryEntry } from '@/lib/getPlayerMoveHistory'
import { cn } from '@/lib/utils'
import { useLongPress } from '@/hooks/useLongPress'

export const MoveHistoryList = ({ history, onMoveClick, onMoveLongPress, className }: Props) => {
  return (
    <div className={cn('flex flex-col divide-y divide-neutral-200', className)}>
      {history.map((entry, i) => {
        if (entry.isAdjustment) {
          // Display adjustment entry (not editable)
          const scoreClass = entry.score > 0 ? 'text-green-600' : entry.score < 0 ? 'text-red-600' : ''
          const scorePrefix = entry.score > 0 ? '+' : ''
          return (
            <div
              key={i}
              className="flex justify-between gap-2 py-1 text-neutral-500 italic"
            >
              <span className="truncate">Final</span>
              <span className={cn('font-medium', scoreClass)}>
                {scorePrefix}{entry.score}
              </span>
            </div>
          )
        }

        return (
          <MoveHistoryEntry
            key={i}
            entry={entry}
            index={i}
            onMoveClick={onMoveClick}
            onMoveLongPress={onMoveLongPress}
          />
        )
      })}
    </div>
  )
}

const MoveHistoryEntry = ({ entry, index, onMoveClick, onMoveLongPress }: MoveHistoryEntryProps) => {
  const longPressHandlers = useLongPress({
    onLongPress: () => onMoveLongPress?.(index),
    onClick: () => onMoveClick(entry.tiles),
  })

  return (
    <div
      className="flex cursor-pointer justify-between gap-2 py-1 text-neutral-600 select-none hover:bg-neutral-100 active:bg-neutral-200"
      {...longPressHandlers}
    >
      <span className="truncate">{entry.words.join(', ') || '(pass)'}</span>
      <span className="font-medium">{entry.score}</span>
    </div>
  )
}

type Props = {
  history: MoveHistoryEntry[]
  onMoveClick: (tiles: Array<{ row: number; col: number }>) => void
  onMoveLongPress?: (playerMoveIndex: number) => void
  className?: string
}

type MoveHistoryEntryProps = {
  entry: MoveHistoryEntry
  index: number
  onMoveClick: (tiles: Array<{ row: number; col: number }>) => void
  onMoveLongPress?: (playerMoveIndex: number) => void
}
