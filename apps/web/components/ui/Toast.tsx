'use client'

import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastData {
  id: string
  type: ToastType
  message: string
}

const toasts = new Map<string, ToastData>()
const listeners = new Set<(toasts: ToastData[]) => void>()

export function showToast(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2)
  toasts.set(id, { id, type, message })
  listeners.forEach(l => l(Array.from(toasts.values())))
  setTimeout(() => {
    toasts.delete(id)
    listeners.forEach(l => l(Array.from(toasts.values())))
  }, 3500)
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastData[]>([])

  useEffect(() => {
    listeners.add(setItems)
    return () => listeners.delete(setItems)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 max-w-sm mx-auto">
      {items.map(toast => {
        const icons = {
          success: <CheckCircle className="w-5 h-5 text-green-500" />,
          error: <AlertCircle className="w-5 h-5 text-red-500" />,
          info: <Info className="w-5 h-5 text-blue-500" />,
        }
        const styles = {
          success: 'bg-green-50 border-green-200',
          error: 'bg-red-50 border-red-200',
          info: 'bg-blue-50 border-blue-200',
        }
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-down',
              styles[toast.type]
            )}
          >
            {icons[toast.type]}
            <p className="text-sm flex-1">{toast.message}</p>
          </div>
        )
      })}
    </div>
  )
}