'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        router.push('/dashboard')
      }
    })
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Overujem prihlásenie...</p>
    </div>
  )
}