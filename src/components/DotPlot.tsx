import { useState, useRef, useEffect } from "react"
import { cx } from "@/lib/cx"

/** Generate nice tick values for an axis range */
const generateTicks = (min: number, max: number): number[] => {
  const range = max - min
  if (range <= 0) return [min]

  // Determine a nice step size based on the range
  // Aim for about 4-5 ticks
  const rawStep = range / 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))

  // Round to nearest nice step (1, 2, 5, 10, 20, 50, etc.)
  let step: number
  const normalized = rawStep / magnitude
  if (normalized <= 1.5) step = magnitude
  else if (normalized <= 3) step = 2 * magnitude
  else if (normalized <= 7) step = 5 * magnitude
  else step = 10 * magnitude

  // Generate ticks at nice round numbers
  const ticks: number[] = []
  const start = Math.ceil(min / step) * step
  for (let tick = start; tick < max; tick += step) {
    // Skip ticks that are too close to min or max
    if (tick > min && tick < max) {
      ticks.push(tick)
    }
  }
  return ticks
}

export const DotPlot = ({
  data,
  minValue,
  maxValue,
  color = "teal",
  getTooltip,
  referenceLines = [],
}: Props) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close tooltip when clicking outside
  useEffect(() => {
    if (selectedIndex === null) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedIndex(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [selectedIndex])

  if (data.length === 0) return null

  const min = minValue ?? Math.min(...data.map(d => d.value))
  const max = maxValue ?? Math.max(...data.map(d => d.value))
  const range = max - min

  // Group data points into bins for vertical stacking
  // Use ~20-30 bins for good granularity
  const binCount = 25
  const binSize = range > 0 ? range / binCount : 1

  // Assign each data point to a bin and track vertical position within bin
  type PositionedDot = {
    dataPoint: DataPoint
    index: number
    binIndex: number
    stackIndex: number
    x: number
  }

  const bins = new Map<number, PositionedDot[]>()

  data.forEach((dataPoint, index) => {
    const binIndex = range > 0 ? Math.floor((dataPoint.value - min) / binSize) : 0
    const clampedBinIndex = Math.min(binIndex, binCount - 1)

    if (!bins.has(clampedBinIndex)) {
      bins.set(clampedBinIndex, [])
    }
    const bin = bins.get(clampedBinIndex)!
    const stackIndex = bin.length

    // Calculate x position (center of bin)
    const x = ((clampedBinIndex + 0.5) / binCount) * 100

    bin.push({ dataPoint, index, binIndex: clampedBinIndex, stackIndex, x })
  })

  // Find max stack height for scaling
  const maxStackHeight = Math.max(...Array.from(bins.values()).map(b => b.length))

  // Flatten all positioned dots
  const positionedDots: PositionedDot[] = Array.from(bins.values()).flat()

  // Fixed dot size
  const dotSize = 6
  const dotSpacing = dotSize + 1

  // Calculate height dynamically based on tallest stack
  // Minimum height of 48px, but grow to fit all dots
  const minHeight = 48
  const requiredHeight = maxStackHeight * dotSpacing
  const chartHeight = Math.max(minHeight, requiredHeight)

  // Add spacing at bottom so dots don't touch axis (matching dot spacing)
  const chartHeightWithPadding = chartHeight + dotSpacing

  return (
    <div className="flex flex-col" ref={containerRef}>
      <div className="relative" style={{ height: chartHeightWithPadding }}>
        {/* Avg label at top of chart, flush left against the vertical line */}
        {referenceLines
          .filter(line => line.type === "avg")
          .map((line, i) => {
            const xPos = range > 0 ? ((line.value - min) / range) * 100 : 0
            return (
              <span
                key={`label-avg-${i}`}
                className={cx(
                  "absolute top-0 whitespace-nowrap rounded px-1.5 py-0.5 text-xs text-white",
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
        {/* Tooltip - positioned next to the selected dot */}
        {selectedIndex !== null &&
          (() => {
            const selectedDot = positionedDots.find(d => d.index === selectedIndex)
            if (!selectedDot) return null
            const tooltipBottom = selectedDot.stackIndex * dotSpacing + dotSpacing + dotSize + 4
            return (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-2 py-0.5 text-xs text-white"
                style={{
                  left: `${selectedDot.x}%`,
                  bottom: tooltipBottom,
                }}
              >
                {getTooltip?.(data[selectedIndex]) ?? data[selectedIndex].value}
              </div>
            )
          })()}
        {/* Reference lines (vertical lines in chart area) - only for "avg" type */}
        {referenceLines
          .filter(line => line.type !== "best")
          .map((line, i) => {
            const xPos = range > 0 ? ((line.value - min) / range) * 100 : 0
            return (
              <div
                key={`ref-${i}`}
                className={cx(
                  "absolute top-0 h-full w-px",
                  color === "teal" ? "bg-teal-600" : "bg-amber-600",
                )}
                style={{ left: `${xPos}%` }}
              />
            )
          })}
        {positionedDots.map(({ index, stackIndex, x }) => (
          <div
            key={index}
            className={cx(
              "absolute cursor-pointer rounded-full transition-all",
              color === "teal" ? "bg-teal-500" : "bg-amber-500",
              selectedIndex !== null && selectedIndex !== index ? "opacity-30" : "",
              selectedIndex === index ? "ring-2 ring-neutral-800" : "",
            )}
            style={{
              width: dotSize,
              height: dotSize,
              left: `calc(${x}% - ${dotSize / 2}px)`,
              bottom: stackIndex * dotSpacing + dotSpacing,
            }}
            onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
          />
        ))}
      </div>
      {/* X-axis line */}
      <div className="relative h-px bg-neutral-300">
        {/* Intermediate tick marks */}
        {generateTicks(min, max).map(tick => {
          const xPos = range > 0 ? ((tick - min) / range) * 100 : 0
          return (
            <div
              key={`tick-${tick}`}
              className="absolute -top-0.5 h-1 w-px bg-neutral-300"
              style={{ left: `${xPos}%` }}
            />
          )
        })}
        {/* Reference line tick marks - only for "avg" type */}
        {referenceLines
          .filter(line => line.type !== "best")
          .map((line, i) => {
            const xPos = range > 0 ? ((line.value - min) / range) * 100 : 0
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
      <div className="relative h-10 text-[10px] text-neutral-400">
        <span>{min}</span>
        {/* Intermediate tick labels */}
        {generateTicks(min, max).map(tick => {
          const xPos = range > 0 ? ((tick - min) / range) * 100 : 0
          return (
            <span key={tick} className="absolute -translate-x-1/2" style={{ left: `${xPos}%` }}>
              {tick}
            </span>
          )
        })}
        <span className="absolute right-0">{max}</span>
        {/* Best label below axis (avg label is positioned at top of chart) */}
        {referenceLines
          .filter(line => line.type === "best")
          .map((line, i) => {
            const xPos = range > 0 ? ((line.value - min) / range) * 100 : 0
            // Clamp position to avoid labels going off-edge
            const clampedPos = Math.max(8, Math.min(92, xPos))
            return (
              <span
                key={`label-best-${i}`}
                className={cx(
                  "absolute top-4 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-xs text-white",
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

export type DataPoint = {
  value: number
  label?: string
}

export type ReferenceLine = {
  value: number
  label: string
  labelValue?: number | string
  type?: "avg" | "best"
}

type Props = {
  data: DataPoint[]
  minValue?: number
  maxValue?: number
  color?: "teal" | "amber"
  getTooltip?: (dataPoint: DataPoint) => string
  referenceLines?: ReferenceLine[]
}
