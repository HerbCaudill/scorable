import { useRef, useCallback } from "react"

const LONG_PRESS_THRESHOLD_MS = 400

export const useLongPress = (onLongPress: () => void, enabled = true) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggeredRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (!enabled) return
    triggeredRef.current = false
    clear()
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true
      onLongPress()
    }, LONG_PRESS_THRESHOLD_MS)
  }, [enabled, onLongPress, clear])

  const cancel = useCallback(() => {
    clear()
  }, [clear])

  return useCallback(
    () => ({
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onContextMenu: (e: React.MouseEvent) => {
        // Prevent context menu on long press
        if (triggeredRef.current) {
          e.preventDefault()
        }
      },
    }),
    [start, cancel],
  )
}
