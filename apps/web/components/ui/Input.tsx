import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-11 px-3.5 rounded-xl border text-sm bg-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'placeholder:text-gray-400',
            error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input