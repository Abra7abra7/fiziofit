import { cn } from '@/lib/utils'
import { forwardRef, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
          {
            'bg-blue-600 text-white hover:bg-blue-700 shadow-sm': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            'border-2 border-gray-200 text-gray-700 hover:bg-gray-50': variant === 'outline',
            'text-gray-600 hover:bg-gray-100': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          },
          {
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-5 text-sm': size === 'md',
            'h-13 px-6 text-base': size === 'lg',
          },
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{children}</span>
          </div>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button