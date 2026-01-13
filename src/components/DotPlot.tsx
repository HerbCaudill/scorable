import { useState } from "react"
import { cx } from "@/lib/cx"

export const DotPlot = ({ data, minValue, maxValue, color = "teal", getTooltip }: Props) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

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

  // Calculate dot size based on available space and data density
  // Height is 48px, each dot needs some space
  const dotSize = Math.max(4, Math.min(8, 48 / maxStackHeight - 1))

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-2 py-0.5 text-xs text-white">
            {getTooltip?.(data[hoveredIndex]) ?? data[hoveredIndex].value}
          </div>
        )}
        <div className="relative" style={{ height: 48 }} onMouseLeave={() => setHoveredIndex(null)}>
          {positionedDots.map(({ dataPoint, index, stackIndex, x }) => (
            <div
              key={index}
              className={cx(
                "absolute cursor-pointer rounded-full transition-all",
                color === "teal" ? "bg-teal-500" : "bg-amber-500",
                hoveredIndex !== null && hoveredIndex !== index ? "opacity-30" : "",
                hoveredIndex === index ? "ring-2 ring-neutral-800" : "",
              )}
              style={{
                width: dotSize,
                height: dotSize,
                left: `calc(${x}% - ${dotSize / 2}px)`,
                bottom: stackIndex * (dotSize + 1),
              }}
              onMouseEnter={() => setHoveredIndex(index)}
            />
          ))}
        </div>
      </div>
      {/* X-axis line and labels */}
      <div className="h-px bg-neutral-300" />
      <div className="flex justify-between text-xs text-neutral-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export type DataPoint = {
  value: number
  label?: string
}

type Props = {
  data: DataPoint[]
  minValue?: number
  maxValue?: number
  color?: "teal" | "amber"
  getTooltip?: (dataPoint: DataPoint) => string
}
