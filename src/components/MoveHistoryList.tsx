import type { MoveHistoryEntry } from '@/lib/getPlayerMoveHistory'
import { cn } from '@/lib/utils'
import { useLongPress } from '@/hooks/useLongPress'

export const MoveHistoryList = ({ history, onMoveClick, onMoveLongPress, editingIndex, className }: Props) => {
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
              className="flex justify-between gap-2 px-1 py-1.5 text-neutral-500 italic"
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
            isEditing={editingIndex === i}
            onMoveClick={onMoveClick}
            onMoveLongPress={onMoveLongPress}
          />
        )
      })}
    </div>
  )
}

const MoveHistoryEntry = ({ entry, index, isEditing, onMoveClick, onMoveLongPress }: MoveHistoryEntryProps) => {
  const longPressHandlers = useLongPress({
    onLongPress: () => onMoveLongPress?.(index),
    onClick: () => onMoveClick(entry.tiles),
  })

  return (
    <div
      className={cn(
        'flex cursor-pointer justify-between gap-2 px-1 py-1.5 select-none hover:bg-neutral-100 active:bg-neutral-200',
        isEditing ? 'bg-teal-100 text-teal-800 font-medium' : 'text-neutral-600'
      )}
      {...longPressHandlers}
    >
      <span className="truncate">
        {entry.words.length > 0 ? entry.words.join(', ') : <em className="text-neutral-400">(pass)</em>}
      </span>
      <span className="font-medium">{entry.score}</span>
    </div>
  )
}

type Props = {
  history: MoveHistoryEntry[]
  onMoveClick: (tiles: Array<{ row: number; col: number }>) => void
  onMoveLongPress?: (playerMoveIndex: number) => void
  editingIndex?: number
  className?: string
}

type MoveHistoryEntryProps = {
  entry: MoveHistoryEntry
  index: number
  isEditing: boolean
  onMoveClick: (tiles: Array<{ row: number; col: number }>) => void
  onMoveLongPress?: (playerMoveIndex: number) => void
}
