import type { MoveHistoryEntry } from '@/lib/getPlayerMoveHistory'
import { cn } from '@/lib/utils'

type Props = {
  history: MoveHistoryEntry[]
  onMoveClick: (tiles: Array<{ row: number; col: number }>) => void
  className?: string
}

export const MoveHistoryList = ({ history, onMoveClick, className }: Props) => {
  return (
    <div className={cn('flex flex-col divide-y divide-neutral-200', className)}>
      {history.map((entry, i) => (
        <div
          key={i}
          className="flex cursor-pointer justify-between gap-2 py-1 text-neutral-600 hover:bg-neutral-100"
          onClick={() => onMoveClick(entry.tiles)}
        >
          <span className="truncate">{entry.words.join(', ') || '(pass)'}</span>
          <span className="font-medium">{entry.score}</span>
        </div>
      ))}
    </div>
  )
}
