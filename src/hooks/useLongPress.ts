import { useRef, useCallback } from "react"

export const useLongPress = ({ onLongPress, onClick, duration = 500 }: Options) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)

  const start = useCallback(() => {
    longPressedRef.current = false
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      onLongPress()
    }, duration)
  }, [onLongPress, duration])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const end = useCallback(() => {
    cancel()
    if (!longPressedRef.current && onClick) {
      onClick()
    }
  }, [cancel, onClick])

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end,
  }
}

type Options = {
  onLongPress: () => void
  onClick?: () => void
  duration?: number
}
