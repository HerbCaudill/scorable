import { cx } from "@/lib/cx"

export const Histogram = ({ data, label, color = "teal", minValue, maxValue }: Props) => {
  if (data.length === 0) return null

  // Create bins for the histogram
  // Use provided range if given, otherwise calculate from data
  const dataMin = Math.min(...data)
  const dataMax = Math.max(...data)
  const min = minValue ?? dataMin
  const max = maxValue ?? dataMax
  const range = max - min

  // If all values are the same, show a single bar
  if (range === 0) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-end justify-center gap-0.5" style={{ height: 40 }}>
          <div
            className={cx("w-full rounded-t", color === "teal" ? "bg-teal-500" : "bg-amber-500")}
            style={{ height: "100%" }}
          />
        </div>
        <div className="flex justify-between text-xs text-neutral-400">
          <span>{min}</span>
          <span className="text-neutral-500">{label}</span>
          <span>{max}</span>
        </div>
      </div>
    )
  }

  // Aim for ~8-12 bins, with nice round numbers
  const binCount = Math.min(12, Math.max(5, data.length))
  const binSize = Math.ceil(range / binCount)
  const adjustedMin = Math.floor(min / binSize) * binSize
  const bins: number[] = []
  const actualBinCount = Math.ceil((max - adjustedMin) / binSize) + 1

  for (let i = 0; i < actualBinCount; i++) {
    bins.push(0)
  }

  // Count values in each bin
  for (const value of data) {
    const binIndex = Math.floor((value - adjustedMin) / binSize)
    bins[Math.min(binIndex, bins.length - 1)]++
  }

  const maxCount = Math.max(...bins)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end justify-center gap-0.5" style={{ height: 40 }}>
        {bins.map((count, i) => (
          <div
            key={i}
            className={cx(
              "min-w-1 flex-1 rounded-t",
              color === "teal" ? "bg-teal-500" : "bg-amber-500",
            )}
            style={{
              height: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
              minHeight: count > 0 ? 2 : 0,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-neutral-400">
        <span>{adjustedMin}</span>
        <span className="text-neutral-500">{label}</span>
        <span>{adjustedMin + (bins.length - 1) * binSize}</span>
      </div>
    </div>
  )
}

type Props = {
  data: number[]
  label: string
  color?: "teal" | "amber"
  minValue?: number
  maxValue?: number
}
