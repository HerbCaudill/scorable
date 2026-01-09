import { IconPlayerPauseFilled } from "@tabler/icons-react"
import { DEFAULT_TIME_MS } from "@/lib/types"

type Props = {
  timeRemainingMs: number
  color: string
  isActive?: boolean
  isPaused?: boolean
}

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export const Timer = ({ timeRemainingMs, color, isActive = true, isPaused = false }: Props) => {
  const timeRemainingPercent = Math.max(0, (timeRemainingMs / DEFAULT_TIME_MS) * 100)
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeRemainingPercent / 100) * circumference

  return (
    <div
      role="timer"
      aria-label={`${formatTime(timeRemainingMs)} remaining`}
      className="relative flex size-12 shrink-0 items-center justify-center transition-opacity"
      style={{ opacity: isActive && !isPaused ? 1 : 0.4 }}
    >
      <svg className="absolute size-12 rotate-90 -scale-x-100">
        {/* Background circle (time used) */}
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e5e5e5" strokeWidth="4" />
        {/* Progress circle (time remaining) */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[10px] font-medium">{formatTime(timeRemainingMs)}</span>
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconPlayerPauseFilled size={24} className="opacity-25" />
        </div>
      )}
    </div>
  )
}
