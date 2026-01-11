import { IconBackspace, IconChevronDown } from "@tabler/icons-react"
import { cx } from "@/lib/cx"

/** Direction indicator that mirrors the cursor style on the board */
const DirectionIndicator = ({ direction }: { direction: "horizontal" | "vertical" }) => {
  const triangleClasses =
    direction === "horizontal" ?
      // Right-pointing triangle
      "left-full top-1/2 -translate-y-1/2 border-t-[5px] border-b-[5px] border-l-[6px] border-t-transparent border-b-transparent border-l-teal-600"
      // Down-pointing triangle
    : "top-full left-1/2 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-teal-600"

  return (
    <div className="relative size-5 ring-[2.5px] ring-teal-600 ring-inset">
      <div className={cx("absolute w-0 h-0 border-solid", triangleClasses)} />
    </div>
  )
}

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
]

export const MobileKeyboard = ({ onKeyPress, direction, visible }: Props) => {
  const handleKeyPress = (key: string) => (e: React.MouseEvent | React.TouchEvent) => {
    // Only preventDefault on mouse events (touch events are passive by default)
    if (e.type === "mousedown") {
      e.preventDefault()
    }
    e.stopPropagation()
    // Prevent duplicate events - only handle touchStart OR mouseDown, not both
    if (e.type === "mousedown" && "ontouchstart" in window) return

    // For Enter key, block ghost clicks that could hit elements underneath
    if (key === "Enter") {
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

      {/* Bottom row: Direction toggle, Blank, Done */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          className={cx(
            "flex h-11 w-12 items-center justify-center rounded-md bg-neutral-300 font-semibold",
            "shadow-[0_2px_0_0_var(--color-neutral-500)] active:shadow-none active:translate-y-[2px]",
            "touch-manipulation select-none",
          )}
          onTouchStart={handleKeyPress("ToggleDirection")}
          onMouseDown={handleKeyPress("ToggleDirection")}
        >
          <DirectionIndicator direction={direction ?? "horizontal"} />
        </button>
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
            "flex h-11 w-16 items-center justify-center rounded-md bg-teal-500 font-semibold text-white",
            "shadow-[0_2px_0_0_var(--color-teal-700)] active:shadow-none active:translate-y-[2px]",
            "touch-manipulation select-none",
          )}
          onTouchStart={handleKeyPress("Enter")}
          onMouseDown={handleKeyPress("Enter")}
        >
          Done
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
  direction?: "horizontal" | "vertical"
  visible: boolean
}
