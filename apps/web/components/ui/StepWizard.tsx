'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  content: React.ReactNode
}

interface StepWizardProps {
  steps: Step[]
  onComplete: () => void
  className?: string
}

export default function StepWizard({ steps, onComplete, className }: StepWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const containerRef = useRef<HTMLDivElement>(null)

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection('next')
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection('prev')
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium">
            Krok {currentStep + 1} z {steps.length}
          </span>
          <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24" ref={containerRef}>
        <div className="animate-fade-in">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{steps[currentStep].title}</h2>
          {steps[currentStep].content}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 safe-area-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={goPrev}
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              Späť
            </button>
          )}
          <button
            onClick={goNext}
            className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
          >
            {currentStep < steps.length - 1 ? 'Pokračovať' : 'Dokončiť'}
          </button>
        </div>
      </div>
    </div>
  )
}