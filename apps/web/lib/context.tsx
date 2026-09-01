'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type UserRole = 'admin' | 'doctor' | 'physio' | 'trainer' | 'patient'

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string | null
  role: UserRole
  birth_date?: string | null
  gender?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

interface AppContextType {
  user: any | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AppContext = createContext<AppContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export const useApp = () => useContext(AppContext)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async () => {
    try {
      const { data: { user: u } } = await createClient().auth.getUser()
      // Získať access_token z aktuálnej session
      const { data: { session } } = await createClient().auth.getSession()
      setUser(u)
      if (u && session?.access_token) {
        // Fetch profile priamo cez REST API s Bearer tokenom
        // (@supabase/ssr cookies nefungujú krížom cez porty :3099→:3004)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${u.id}&select=*`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${u.access_token}`,
            },
          }
        )
        if (res.ok) {
          const data = await res.json()
          if (data && data.length > 0) {
            setProfile(data[0])
          }
        }
      }
    } catch (e) {
      console.error('Profile load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile()
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
        loadProfile()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AppContext.Provider value={{ user, profile, loading, refreshProfile: loadProfile }}>
      {children}
    </AppContext.Provider>
  )
}