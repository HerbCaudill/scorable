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
        <div className="text-center text-xs text-neutral-500">{label}</div>
        <div className="flex items-end justify-center gap-0.5" style={{ height: 40 }}>
          <div
            className={cx("w-full rounded-t", color === "teal" ? "bg-teal-500" : "bg-amber-500")}
            style={{ height: "100%" }}
          />
        </div>
        <div className="flex justify-center text-xs text-neutral-400">
          <span>{min}</span>
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
  const adjustedMax = adjustedMin + (bins.length - 1) * binSize

  // Calculate tick marks for x-axis (show ~3-5 ticks)
  const xAxisTicks = getXAxisTicks(adjustedMin, adjustedMax, bins.length)

  return (
    <div className="flex flex-col gap-1">
      <div className="text-center text-xs text-neutral-500">{label}</div>
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
      {/* X-axis with tick marks */}
      <div className="relative h-3">
        {xAxisTicks.map(tick => (
          <span
            key={tick.value}
            className="absolute -translate-x-1/2 text-xs text-neutral-400"
            style={{ left: `${tick.position}%` }}
          >
            {tick.value}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Calculate evenly distributed tick marks for the x-axis */
const getXAxisTicks = (min: number, max: number, binCount: number) => {
  const ticks: { value: number; position: number }[] = []

  // Always show first and last tick
  ticks.push({ value: min, position: 0 })
  ticks.push({ value: max, position: 100 })

  // Add middle tick if there's enough range
  if (binCount >= 5) {
    const mid = Math.round((min + max) / 2)
    ticks.push({ value: mid, position: 50 })
  }

  // Sort by position
  ticks.sort((a, b) => a.position - b.position)

  return ticks
}

type Props = {
  data: number[]
  label: string
  color?: "teal" | "amber"
  minValue?: number
  maxValue?: number
}
