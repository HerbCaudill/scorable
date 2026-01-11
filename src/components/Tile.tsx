import { getTileValue } from "@/lib/getTileValue"
import { isBlankTile, getTileDisplayLetter } from "@/lib/isBlankTile"
import { cx } from "@/lib/cx"

type Props = {
  letter: string
  variant?: "existing" | "new"
  className?: string
}

export const Tile = ({ letter, variant = "existing", className }: Props) => {
  const value = getTileValue(letter)
  const isExisting = variant === "existing"
  const isBlank = isBlankTile(letter)
  const displayLetter = getTileDisplayLetter(letter)
  const ariaLabel =
    isBlank ?
      displayLetter ? `Blank tile representing ${displayLetter}`
      : "Blank tile"
    : `${displayLetter}${value > 0 ? `, ${value} points` : ""}`

  return (
    <div
      className={cx(
        "@container relative flex h-full w-full items-center justify-center rounded-[2%] shadow-sm z-0",
        isExisting ? "bg-amber-100" : "bg-teal-300",
        className,
      )}
      aria-label={ariaLabel}
    >
      <span
        className={cx(
          "text-[55cqw] font-bold leading-none",
          isExisting ? "text-khaki-800" : "text-teal-800",
          isBlank && "opacity-25",
        )}
      >
        {displayLetter}
      </span>
      <span
        className={cx(
          "absolute bottom-[3%] right-[6%] text-[25cqw] font-semibold leading-none",
          isExisting ? "text-khaki-600" : "text-teal-600",
        )}
      >
        {value > 0 ? value : ""}
      </span>
    </div>
  )
}
