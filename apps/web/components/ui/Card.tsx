import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 pt-4 pb-2', className)}>{children}</div>
}

export function CardContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-3', className)}>{children}</div>
}

export function CardFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-3 border-t border-gray-50', className)}>{children}</div>
}