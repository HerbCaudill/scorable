import { useState } from "react"
import { cx } from "@/lib/cx"

export const Histogram = ({
  data,
  label = "",
  color = "teal",
  minValue,
  maxValue,
  referenceLines = [],
}: Props) => {
  const [hoveredBin, setHoveredBin] = useState<number | null>(null)
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
        {label && <div className="text-center text-xs text-neutral-500">{label}</div>}
        <div className="flex items-end justify-center gap-0.5" style={{ height: 40 }}>
          <div
            className={cx("w-full rounded-t", color === "teal" ? "bg-teal-500" : "bg-amber-500")}
            style={{ height: "100%" }}
          />
        </div>
        <div className="h-px bg-neutral-300" />
        <div className="flex justify-center text-xs text-neutral-400">
          <span>{min}</span>
        </div>
      </div>
    )
  }

  // Aim for ~15-20 bins for more granularity
  const binCount = Math.min(20, Math.max(10, data.length))
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

  // Calculate bin range for tooltip
  const getBinRange = (binIndex: number) => {
    const binStart = adjustedMin + binIndex * binSize
    const binEnd = binStart + binSize - 1
    return { binStart, binEnd }
  }

  const adjustedRange = adjustedMax - adjustedMin

  return (
    <div className="flex flex-col gap-1">
      {label && <div className="text-center text-xs text-neutral-500">{label}</div>}
      <div className="relative pt-5">
        {/* Avg label at top of chart, flush left against the vertical line */}
        {referenceLines
          .filter(line => line.type === "avg")
          .map((line, i) => {
            const xPos = adjustedRange > 0 ? ((line.value - adjustedMin) / adjustedRange) * 100 : 0
            return (
              <span
                key={`label-avg-${i}`}
                className={cx(
                  "absolute top-0 whitespace-nowrap rounded px-1 text-xs text-white",
                  color === "teal" ? "bg-teal-600" : "bg-amber-600",
                )}
                style={{ left: `calc(${xPos}% + 4px)` }}
              >
                {line.label}
                {line.labelValue !== undefined && (
                  <span className="font-bold"> {line.labelValue}</span>
                )}
              </span>
            )
          })}
        {/* Tooltip */}
        {hoveredBin !== null && bins[hoveredBin] > 0 && (
          <div className="pointer-events-none absolute top-0 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-2 py-0.5 text-xs text-white">
            {getBinRange(hoveredBin).binStart}-{getBinRange(hoveredBin).binEnd}: {bins[hoveredBin]}
          </div>
        )}
        {/* Reference lines (vertical lines in chart area) - only for "avg" type */}
        {referenceLines
          .filter(line => line.type !== "best")
          .map((line, i) => {
            const xPos = adjustedRange > 0 ? ((line.value - adjustedMin) / adjustedRange) * 100 : 0
            return (
              <div
                key={`ref-${i}`}
                className={cx(
                  "absolute top-5 z-10 w-px",
                  color === "teal" ? "bg-teal-600" : "bg-amber-600",
                )}
                style={{ left: `${xPos}%`, height: 56 }}
              />
            )
          })}
        <div
          className="flex items-end justify-center gap-0.5"
          style={{ height: 56 }}
          onMouseLeave={() => setHoveredBin(null)}
        >
          {bins.map((count, i) => (
            <div
              key={i}
              className={cx(
                "min-w-1 flex-1 cursor-pointer rounded-t transition-opacity",
                color === "teal" ? "bg-teal-500" : "bg-amber-500",
                hoveredBin !== null && hoveredBin !== i ? "opacity-50" : "",
              )}
              style={{
                height: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                minHeight: count > 0 ? 2 : 0,
              }}
              onMouseEnter={() => setHoveredBin(i)}
            />
          ))}
        </div>
      </div>
      {/* X-axis line */}
      <div className="relative h-px bg-neutral-300">
        {/* Reference line tick marks - only for "avg" type */}
        {referenceLines
          .filter(line => line.type !== "best")
          .map((line, i) => {
            const xPos = adjustedRange > 0 ? ((line.value - adjustedMin) / adjustedRange) * 100 : 0
            return (
              <div
                key={`tick-${i}`}
                className={cx(
                  "absolute -top-1 h-2 w-px",
                  color === "teal" ? "bg-teal-600" : "bg-amber-600",
                )}
                style={{ left: `${xPos}%` }}
              />
            )
          })}
      </div>
      {/* X-axis labels */}
      <div className="relative h-4 text-[10px] text-neutral-400">
        <span>{adjustedMin}</span>
        <span className="absolute right-0">{adjustedMax}</span>
        {/* Best label below axis */}
        {referenceLines
          .filter(line => line.type === "best")
          .map((line, i) => {
            const xPos = adjustedRange > 0 ? ((line.value - adjustedMin) / adjustedRange) * 100 : 0
            // Clamp position to avoid labels going off-edge
            const clampedPos = Math.max(8, Math.min(92, xPos))
            return (
              <span
                key={`label-best-${i}`}
                className={cx(
                  "absolute top-3 -translate-x-1/2 whitespace-nowrap rounded px-1 text-xs text-white",
                  color === "teal" ? "bg-teal-600" : "bg-amber-600",
                )}
                style={{ left: `${clampedPos}%` }}
              >
                {line.label}
                {line.labelValue !== undefined && (
                  <span className="font-bold"> {line.labelValue}</span>
                )}
              </span>
            )
          })}
      </div>
    </div>
  )
}

export type ReferenceLine = {
  value: number
  label: string
  labelValue?: number | string
  type?: "avg" | "best"
}

type Props = {
  data: number[]
  label?: string
  color?: "teal" | "amber"
  minValue?: number
  maxValue?: number
  referenceLines?: ReferenceLine[]
}
