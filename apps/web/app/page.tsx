'use client'

import Link from 'next/link'
import { Dumbbell, Activity, Calendar, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <header className="bg-blue-600 text-white px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Activity className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">FizioFit</h1>
          <p className="text-blue-100 mb-6">
            Systém pre fyzioterapiu, diagnostiku a tréningy
          </p>
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold"
            >
              Vstúpiť do systému
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex gap-3 justify-center">
              <Link
                href="/login"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold"
              >
                Prihlásiť sa
              </Link>
              <Link
                href="/register"
                className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Registrovať
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Features */}
      <section className="flex-1 px-4 py-12 max-w-md mx-auto w-full space-y-6">
        <FeatureCard
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          title="Rezervácie"
          description="Online rezervácia termínov k lekárovi, fyzioterapeutovi alebo trénerovi"
        />
        <FeatureCard
          icon={<Dumbbell className="w-6 h-6 text-blue-600" />}
          title="Tréningový denník"
          description="Prehľad cvičení, progres a história pre každého klienta"
        />
        <FeatureCard
          icon={<Activity className="w-6 h-6 text-blue-600" />}
          title="Diagnostika"
          description="Viacero krokový proces s vopred pripravenými otázkami"
        />

        {/* GDPR info */}
        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">🔒 Ochrana údajov</p>
          <p>Vaše zdravotné údaje sú spracovávané v súlade s GDPR a Zákonom o zdravotnej starostlivosti.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-sm text-gray-400 border-t">
        <p>© 2026 FizioFit — Všetky práva vyhradené</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="bg-blue-50 p-2 rounded-lg shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}