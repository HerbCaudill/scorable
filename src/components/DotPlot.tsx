import { useState, useRef, useEffect } from "react"
import { cx } from "@/lib/cx"

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

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <div className="relative">
        {/* Tooltip */}
        {selectedIndex !== null && (
          <div className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-2 py-0.5 text-xs text-white">
            {getTooltip?.(data[selectedIndex]) ?? data[selectedIndex].value}
          </div>
        )}
        <div className="relative" style={{ height: chartHeight }}>
          {/* Reference lines (vertical dashes in chart area) */}
          {referenceLines.map((line, i) => {
            const xPos = range > 0 ? ((line.value - min) / range) * 100 : 0
            return (
              <div
                key={`ref-${i}`}
                className="absolute top-0 h-full w-px border-l border-dashed border-neutral-400"
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
                bottom: stackIndex * dotSpacing,
              }}
              onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
      {/* X-axis line */}
      <div className="relative h-px bg-neutral-300">
        {/* Reference line tick marks */}
        {referenceLines.map((line, i) => {
          const xPos = range > 0 ? ((line.value - min) / range) * 100 : 0
          return (
            <div
              key={`tick-${i}`}
              className="absolute -top-1 h-2 w-px bg-neutral-400"
              style={{ left: `${xPos}%` }}
            />
          )
        })}
      </div>
      {/* X-axis labels */}
      <div className="relative h-4 text-xs text-neutral-400">
        <span>{min}</span>
        <span className="absolute right-0">{max}</span>
        {/* Reference line labels on a second row to avoid overlap */}
        {referenceLines.map((line, i) => {
          const xPos = range > 0 ? ((line.value - min) / range) * 100 : 0
          // Clamp position to avoid labels going off-edge
          const clampedPos = Math.max(8, Math.min(92, xPos))
          return (
            <span
              key={`label-${i}`}
              className="absolute top-3 -translate-x-1/2 whitespace-nowrap text-[10px] text-neutral-500"
              style={{ left: `${clampedPos}%` }}
            >
              {line.label}
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
}

type Props = {
  data: DataPoint[]
  minValue?: number
  maxValue?: number
  color?: "teal" | "amber"
  getTooltip?: (dataPoint: DataPoint) => string
  referenceLines?: ReferenceLine[]
}
