'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type UserRole = 'admin' | 'doctor' | 'physio' | 'trainer' | 'patient'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  avatar_url?: string
}

interface AppContextType {
  user: any | null
  profile: UserProfile | null
  loading: boolean
  refresh: () => Promise<void>
}

const AppContext = createContext<AppContextType>({
  user: null,
  profile: null,
  loading: true,
  refresh: async () => {},
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadProfile = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (u) {
      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      setProfile(data as UserProfile)
    }
    setLoading(false)
  }

  useEffect(() => { loadProfile() }, [])

  return (
    <AppContext.Provider value={{ user, profile, loading, refresh: loadProfile }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)