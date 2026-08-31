'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Calendar, Dumbbell, Activity, User, ClipboardList, LayoutDashboard } from 'lucide-react'
import { useApp } from '@/lib/context'
import { useEffect } from 'react'
import BottomNav from '@/components/ui/BottomNav'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading } = useApp()

  // Only show bottom nav on dashboard pages
  const isDashboardPage = pathname?.startsWith('/dashboard') ||
                          pathname?.startsWith('/appointments') ||
                          pathname?.startsWith('/diagnostics') ||
                          pathname?.startsWith('/exercises') ||
                          pathname?.startsWith('/profile') ||
                          pathname?.startsWith('/consents') ||
                          pathname?.startsWith('/admin')

  const getNavItems = () => {
    const role = profile?.role || 'patient'

    const items: { id: string; label: string; icon: React.ReactNode }[] = [
      { id: 'dashboard', label: 'Prehľad', icon: <LayoutDashboard className="w-full h-full" /> },
    ]

    if (role === 'patient') {
      items.push({ id: 'appointments', label: 'Termíny', icon: <Calendar className="w-full h-full" /> })
      items.push({ id: 'exercises', label: 'Cvičenia', icon: <Dumbbell className="w-full h-full" /> })
      items.push({ id: 'profile', label: 'Profil', icon: <User className="w-full h-full" /> })
    } else if (role === 'doctor') {
      items.push({ id: 'appointments', label: 'Pacienti', icon: <ClipboardList className="w-full h-full" /> })
      items.push({ id: 'exercises', label: 'Cvičenia', icon: <Activity className="w-full h-full" /> })
      items.push({ id: 'profile', label: 'Profil', icon: <User className="w-full h-full" /> })
    } else if (role === 'physio') {
      items.push({ id: 'appointments', label: 'Pacienti', icon: <ClipboardList className="w-full h-full" /> })
      items.push({ id: 'exercises', label: 'Cvičenia', icon: <Dumbbell className="w-full h-full" /> })
      items.push({ id: 'profile', label: 'Profil', icon: <User className="w-full h-full" /> })
    } else if (role === 'trainer') {
      items.push({ id: 'appointments', label: 'Klienti', icon: <ClipboardList className="w-full h-full" /> })
      items.push({ id: 'exercises', label: 'Tréningy', icon: <Dumbbell className="w-full h-full" /> })
      items.push({ id: 'profile', label: 'Profil', icon: <User className="w-full h-full" /> })
    } else if (role === 'admin') {
      items.push({ id: 'appointments', label: 'Všetko', icon: <ClipboardList className="w-full h-full" /> })
      items.push({ id: 'exercises', label: 'Nastavenia', icon: <Activity className="w-full h-full" /> })
      items.push({ id: 'profile', label: 'Profil', icon: <User className="w-full h-full" /> })
    }
    return items
  }

  const getActiveId = () => {
    if (pathname?.startsWith('/appointments')) return 'appointments'
    if (pathname?.startsWith('/diagnostics')) return 'diagnostics'
    if (pathname?.startsWith('/exercises')) return 'exercises'
    if (pathname?.startsWith('/profile')) return 'profile'
    if (pathname?.startsWith('/admin')) return 'admin'
    return 'dashboard'
  }

  const handleNavigate = (id: string) => {
    const paths: Record<string, string> = {
      dashboard: '/dashboard',
      appointments: '/appointments',
      diagnostics: '/diagnostics',
      exercises: '/exercises',
      profile: '/profile',
      admin: '/admin',
    }
    router.push(paths[id] || '/dashboard')
  }

  if (!isDashboardPage) return <>{children}</>

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 pb-20">
      <div className="pb-4">
        {children}
      </div>
      <BottomNav
        items={getNavItems()}
        activeId={getActiveId()}
        onNavigate={handleNavigate}
      />
    </div>
  )
}