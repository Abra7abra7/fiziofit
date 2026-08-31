'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ConsentsPage() {
  const [consents, setConsents] = useState<any[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('consent_logs')
        .select('*')
        .eq('profile_id', user.id)
        .order('signed_at', { ascending: false })
      setConsents(data || [])
    })
  }, [router, supabase])

  return (
    <div className="max-w-lg mx-auto p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Moje súhlasy</h1>
        <Link href="/dashboard" className="text-sm text-blue-600">Späť</Link>
      </header>

      {consents.length === 0 ? (
        <p className="text-gray-400 text-sm">Zatiaľ ste neposkytli žiadne súhlasy</p>
      ) : (
        <div className="space-y-3">
          {consents.map((c: any) => (
            <div key={c.id} className="bg-white p-4 rounded-lg shadow-sm text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{c.consent_type}</span>
                <span className={c.action === 'granted' ? 'text-green-600' : 'text-red-600'}>
                  {c.action === 'granted' ? 'Udelený' : c.action}
                </span>
              </div>
              <p className="text-gray-400">Verzia: {c.document_version}</p>
              <p className="text-gray-400 text-xs">{new Date(c.signed_at).toLocaleString('sk')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}