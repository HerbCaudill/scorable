import { useRef, useCallback } from "react"

const LONG_PRESS_THRESHOLD_MS = 400
const MOVE_TOLERANCE_PX = 10

export const useLongPress = (onLongPress: () => void, enabled = true) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggeredRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }, [])

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return
      triggeredRef.current = false
      startPosRef.current = { x: e.clientX, y: e.clientY }
      clear()
      timerRef.current = setTimeout(() => {
        triggeredRef.current = true
        onLongPress()
      }, LONG_PRESS_THRESHOLD_MS)
    },
    [enabled, onLongPress, clear],
  )

  const move = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current || !timerRef.current) return
      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      // Cancel if finger moved too much (user is scrolling)
      if (Math.abs(dx) > MOVE_TOLERANCE_PX || Math.abs(dy) > MOVE_TOLERANCE_PX) {
        clear()
      }
    },
    [clear],
  )

  const cancel = useCallback(() => {
    clear()
  }, [clear])

  return useCallback(
    () => ({
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: React.MouseEvent) => {
        // Prevent context menu on long press
        if (triggeredRef.current) {
          e.preventDefault()
        }
      },
    }),
    [start, move, cancel],
  )
}
