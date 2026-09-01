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
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        // Attempt 1: przez supabase client (Authorization header z session)
        const { data, error } = await supabase.from('profiles').select('*').eq('id', u.id).single()
        if (data) {
          setProfile(data as UserProfile ?? null)
          return
        }
        if (error) {
          console.warn('Profile fetch via client failed:', error.message)
        }

        // Attempt 2: raw fetch s tokenom z sessionStorage (uložený po registrácii)
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('sb-refresh-token') || null : null
        if (token) {
          try {
            const res = await fetch(`http://62.238.118.51:3004/rest/v1/profiles?id=eq.${u.id}&select=*`, {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${token}`,
              },
            })
            if (res.ok) {
              const rows = await res.json()
              if (rows && rows.length > 0) {
                setProfile(rows[0] as UserProfile)
                return
              }
            }
          } catch (e) {
            console.warn('Profile fetch raw fallback failed:', e)
          }
        }
        
        setProfile(null)
      }
    } catch (err) {
      console.warn('Profile load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  return (
    <AppContext.Provider value={{ user, profile, loading, refresh: loadProfile }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)