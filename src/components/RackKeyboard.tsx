import { IconBackspace, IconChevronDown } from "@tabler/icons-react"
import { cx } from "@/lib/cx"

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
]

/**
 * Simplified keyboard for entering rack tiles on the EndGameScreen.
 * Similar to MobileKeyboard but without direction toggle (not needed for rack input).
 */
export const RackKeyboard = ({ onKeyPress, visible }: Props) => {
  const handleKeyPress = (key: string) => (e: React.MouseEvent | React.TouchEvent) => {
    // Only preventDefault on mouse events (touch events are passive by default)
    if (e.type === "mousedown") {
      e.preventDefault()
    }
    e.stopPropagation()
    // Prevent duplicate events - only handle touchStart OR mouseDown, not both
    if (e.type === "mousedown" && "ontouchstart" in window) return

    // For keys that hide the keyboard (Escape), block ghost clicks
    // that could hit elements underneath
    if (key === "Escape") {
      const blockClick = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault()
        clickEvent.stopPropagation()
      }
      // Capture phase to block before any handlers run
      document.addEventListener("click", blockClick, { capture: true, once: true })
      // Clean up after the ghost click window (~400ms)
      setTimeout(() => document.removeEventListener("click", blockClick, { capture: true }), 400)
    }

    onKeyPress(key)
  }

  return (
    <div
      className={cx(
        "fixed inset-x-0 bottom-0 z-70 bg-neutral-200 p-4 pb-safe transition-transform duration-200",
        visible ? "translate-y-0" : "translate-y-full pointer-events-none",
      )}
    >
      {/* First two letter rows */}
      {ROWS.slice(0, 2).map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5 mb-3">
          {row.map(letter => (
            <button
              key={letter}
              type="button"
              className={cx(
                "flex h-11 min-w-[9%] flex-1 max-w-10 items-center justify-center rounded-md bg-white font-semibold",
                "shadow-[0_2px_0_0_var(--color-neutral-300)] active:shadow-none active:translate-y-[2px]",
                "touch-manipulation select-none",
              )}
              onTouchStart={handleKeyPress(letter)}
              onMouseDown={handleKeyPress(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      ))}

      {/* Third row: Z-M letters + Backspace */}
      <div className="flex justify-center gap-1.5 mb-3">
        {ROWS[2].map(letter => (
          <button
            key={letter}
            type="button"
            className={cx(
              "flex h-11 min-w-[9%] flex-1 max-w-10 items-center justify-center rounded-md bg-white font-semibold",
              "shadow-[0_2px_0_0_var(--color-neutral-300)] active:shadow-none active:translate-y-[2px]",
              "touch-manipulation select-none",
            )}
            onTouchStart={handleKeyPress(letter)}
            onMouseDown={handleKeyPress(letter)}
          >
            {letter}
          </button>
        ))}
        <button
          type="button"
          className={cx(
            "ml-1.5 flex h-11 min-w-[9%] flex-1 max-w-10 items-center justify-center rounded-md bg-neutral-300 font-semibold",
            "shadow-[0_2px_0_0_var(--color-neutral-500)] active:shadow-none active:translate-y-[2px]",
            "touch-manipulation select-none",
          )}
          onTouchStart={handleKeyPress("Backspace")}
          onMouseDown={handleKeyPress("Backspace")}
        >
          <IconBackspace size={22} />
        </button>
      </div>

      {/* Bottom row: Blank + Hide */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          className={cx(
            "flex h-11 flex-1 items-center justify-center rounded-md bg-white text-sm text-neutral-500",
            "shadow-[0_2px_0_0_var(--color-neutral-300)] active:shadow-none active:translate-y-[2px]",
            "touch-manipulation select-none",
          )}
          onTouchStart={handleKeyPress(" ")}
          onMouseDown={handleKeyPress(" ")}
        >
          blank
        </button>
        <button
          type="button"
          className={cx(
            "flex h-11 w-12 items-center justify-center rounded-md bg-neutral-300 font-semibold",
            "shadow-[0_2px_0_0_var(--color-neutral-500)] active:shadow-none active:translate-y-[2px]",
            "touch-manipulation select-none",
          )}
          onTouchStart={handleKeyPress("Escape")}
          onMouseDown={handleKeyPress("Escape")}
        >
          <IconChevronDown size={22} />
        </button>
      </div>
    </div>
  )
}

type Props = {
  onKeyPress: (key: string) => void
  visible: boolean
}
