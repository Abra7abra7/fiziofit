'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS_SK = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December']
const DAYS_SK = ['Po','Ut','St','Št','Pi','So','Ne']

interface CalendarProps {
  selected: Date | null
  onSelect: (date: Date) => void
  minDate?: Date
  disabledDates?: Date[]
  markedDates?: Date[]
  className?: string
}

export default function Calendar({ selected, onSelect, minDate, disabledDates, markedDates, className }: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date())
  const today = new Date()
  today.setHours(0,0,0,0)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = (firstDay.getDay() + 6) % 7 // Monday first

  const days: (number | null)[] = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i)

  const isDisabled = (day: number) => {
    const date = new Date(year, month, day)
    if (minDate && date < minDate) return true
    if (disabledDates?.some(d => d.toDateString() === date.toDateString())) return true
    return false
  }

  const isMarked = (day: number) => {
    if (!markedDates) return false
    return markedDates.some(d => d.getDate() === day && d.getMonth() === month && d.getFullYear() === year)
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    return selected.getDate() === day && selected.getMonth() === month && selected.getFullYear() === year
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div className={cn('bg-white rounded-xl p-4', className)}>
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="font-semibold text-gray-900">
          {MONTHS_SK[month]} {year}
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_SK.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div key={i} className="aspect-square">
            {day && (
              <button
                onClick={() => !isDisabled(day) && onSelect(new Date(year, month, day))}
                disabled={isDisabled(day)}
                className={cn(
                  'w-full h-full rounded-xl text-sm font-medium transition-all active:scale-90',
                  isSelected(day) && 'bg-blue-600 text-white shadow-md',
                  !isSelected(day) && !isDisabled(day) && 'hover:bg-blue-50 text-gray-700',
                  isDisabled(day) && 'text-gray-200 cursor-not-allowed',
                  isMarked(day) && !isSelected(day) && 'ring-2 ring-blue-200'
                )}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}