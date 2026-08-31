'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ProgressChartProps {
  data: { date: string; value: number; label?: string }[]
  title: string
  unit?: string
  height?: number
  color?: string
  className?: string
}

export default function ProgressChart({
  data, title, unit, height = 160, color = '#0066cc', className
}: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl p-4', className)}>
        <h3 className="font-semibold text-gray-900 text-sm mb-2">{title}</h3>
        <div className="flex items-center justify-center h-20 text-sm text-gray-400">
          Zatiaľ žiadne dáta
        </div>
      </div>
    )
  }

  const values = data.map(d => d.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const barWidth = Math.max(8, Math.min(24, 160 / data.length))

  return (
    <div className={cn('bg-white rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = ((d.value - min) / range) * (height - 20) + 4
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={d.label}>
              <div
                className="w-full rounded-md transition-all hover:opacity-80 relative"
                style={{
                  height: barHeight,
                  backgroundColor: color,
                  minHeight: 4,
                  maxWidth: barWidth,
                }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap transition-opacity">
                  {d.value}{unit ? ` ${unit}` : ''}
                </div>
              </div>
              <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.date}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}