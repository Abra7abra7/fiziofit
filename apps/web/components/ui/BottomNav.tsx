import { cn } from '@/lib/utils'

interface BottomNavProps {
  items: { id: string; label: string; icon: React.ReactNode; href?: string }[]
  activeId: string
  onNavigate: (id: string) => void
}

export default function BottomNav({ items, activeId, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full px-2',
                'transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div className={cn(
                'w-6 h-6',
                isActive && 'drop-shadow-[0_0_8px_rgba(0,102,204,0.3)]'
              )}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}