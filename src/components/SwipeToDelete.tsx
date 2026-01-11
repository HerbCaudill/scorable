import { useState, useRef } from "react"
import { useDrag } from "@use-gesture/react"
import { cn } from "@/lib/utils"
import { IconTrash } from "@tabler/icons-react"

const DELETE_THRESHOLD = -100
const SNAP_BACK_DURATION = 200

export const SwipeToDelete = ({ children, onDelete, className }: Props) => {
  const [offsetX, setOffsetX] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const bind = useDrag(
    ({ movement: [mx], down }) => {
      // Only allow swiping left (negative x)
      const clampedX = Math.min(0, mx)

      if (down) {
        setOffsetX(clampedX)
      } else {
        // Released
        if (clampedX < DELETE_THRESHOLD) {
          // Trigger delete
          setIsDeleting(true)
          // Animate fully off screen
          setOffsetX(-window.innerWidth)
          setTimeout(() => {
            onDelete()
          }, SNAP_BACK_DURATION)
        } else {
          // Snap back
          setOffsetX(0)
        }
      }
    },
    {
      axis: "x",
      filterTaps: true,
      from: () => [offsetX, 0],
    },
  )

  const showDeleteIndicator = offsetX < -20

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Delete background */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 pr-4 transition-opacity",
          showDeleteIndicator ? "opacity-100" : "opacity-0",
        )}
        style={{ width: Math.abs(offsetX) + 20 }}
      >
        <IconTrash size={20} className="text-white" />
      </div>

      {/* Main content */}
      <div
        {...bind()}
        className="relative touch-pan-y bg-white"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition:
            isDeleting || offsetX === 0 ? `transform ${SNAP_BACK_DURATION}ms ease-out` : "none",
        }}
      >
        {children}
      </div>
    </div>
  )
}

type Props = {
  children: React.ReactNode
  onDelete: () => void
  className?: string
}
