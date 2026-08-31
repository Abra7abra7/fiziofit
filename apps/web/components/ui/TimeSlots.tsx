'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface TimeSlotProps {
  slots: string[]
  selected: string | null
  onSelect: (time: string) => void
  busySlots?: string[]
  className?: string
}

export default function TimeSlots({ slots, selected, onSelect, busySlots, className }: TimeSlotProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {slots.map((time) => {
        const isBusy = busySlots?.includes(time)
        const isSelected = time === selected
        return (
          <button
            key={time}
            onClick={() => !isBusy && onSelect(time)}
            disabled={isBusy}
            className={cn(
              'h-11 rounded-xl text-sm font-medium transition-all active:scale-95',
              isSelected && 'bg-blue-600 text-white shadow-md',
              !isSelected && !isBusy && 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100',
              isBusy && 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
            )}
          >
            {time}
          </button>
        )
      })}
    </div>
  )
}