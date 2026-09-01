'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'register' | 'consents'>('register')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [consents, setConsents] = useState({
    gdpr: false,
    gdpr_health: false,
    terms: false,
  })
  const { signUp } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Heslo musí mať aspoň 6 znakov')
      return
    }

    setLoading(true)
    try {
      const result = await signUp(email, password, fullName)
      // Uložiť profilové dáta
      await supabase.from('profiles').upsert({
        id: result.user?.id,
        email,
        full_name: fullName,
        phone,
        role: 'patient',
      })
      setStep('consents')
    } catch (err: any) {
      setError(err.message || 'Chyba pri registrácii')
    } finally {
      setLoading(false)
    }
  }

  const handleConsents = async () => {
    if (!consents.gdpr || !consents.terms) {
      setError('Musíte súhlasiť so spracovaním údajov a obchodnými podmienkami')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      // Zalogovať súhlasy
      const ip = '0.0.0.0' // V produkcii reálna IP
      const logs = [
        { profile_id: user.id, consent_type: 'gdpr_general', action: 'granted', document_version: 'v1.0', ip_address: ip },
        { profile_id: user.id, consent_type: 'terms_conditions', action: 'granted', document_version: 'v1.0', ip_address: ip },
      ]
      if (consents.gdpr_health) {
        logs.push({ profile_id: user.id, consent_type: 'gdpr_health', action: 'granted', document_version: 'v1.0', ip_address: ip })
      }

      for (const log of logs) {
        const { error: e } = await supabase.rpc('log_consent', log)
        if (e) console.error('Consent log error:', e)
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Chyba pri ukladaní súhlasov')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'consents') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Takmer hotovo</h1>
            <p className="text-gray-500 mt-1">Pre dokončenie registrácie potrebujeme vaše súhlasy</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.gdpr}
                onChange={(e) => setConsents({ ...consents, gdpr: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                Súhlasím so spracovaním osobných údajov podľa GDPR.{' '}
                <Link href="/gdpr" className="text-blue-600 underline">Prečítať</Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.gdpr_health}
                onChange={(e) => setConsents({ ...consents, gdpr_health: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                Súhlasím so spracovaním zdravotných údajov na účely diagnostiky a terapie.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.terms}
                onChange={(e) => setConsents({ ...consents, terms: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                Súhlasím s Všeobecnými obchodnými podmienkami.{' '}
                <Link href="/terms" className="text-blue-600 underline">Prečítať</Link>
              </span>
            </label>

            <button
              onClick={handleConsents}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Ukladám...' : 'Dokončiť registráciu'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">FizioFit</h1>
          <p className="text-gray-500 mt-1">Vytvorte si účet</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meno a priezvisko</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefón</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="+421 901 234 567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heslo</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Minimálne 6 znakov"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Registrujem...' : 'Registrovať sa'}
          </button>

          <div className="text-center text-sm text-gray-500">
            Už máte účet?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">Prihlásiť sa</Link>
          </div>
        </form>
      </div>
    </div>
  )
}