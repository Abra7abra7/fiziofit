'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useApp } from '@/lib/context'
import StepWizard from '@/components/ui/StepWizard'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { showToast } from '@/components/ui/Toast'
import { CheckCircle, AlertCircle, Activity, ChevronRight } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  question_type: 'text' | 'choice' | 'scale_1_10' | 'scale_1_5' | 'bool' | 'photo'
  choices?: string[]
  is_health: boolean
  required: boolean
  step_order: number
  category: string
}

export default function DiagnosticsPage() {
  const { profile, loading } = useApp()
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'list' | 'run' | 'consent'>('list')
  const [results, setResults] = useState<any[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [healthConsent, setHealthConsent] = useState(false)

  useEffect(() => {
    if (!loading && !profile?.id) router.push('/login')
  }, [loading, profile])

  // Load questions
  useEffect(() => {
    supabase.from('diagnostic_questions')
      .select('*')
      .eq('is_active', true)
      .order('step_order', { ascending: true })
      .then(({ data }) => setQuestions(data || []))
  }, [])

  // Load past results
  useEffect(() => {
    if (!profile) return
    supabase.from('diagnostic_results')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setResults(data || []))
  }, [profile])

  const handleStart = () => {
    const hasHealth = questions.some(q => q.is_health)
    if (hasHealth) {
      // Show consent first
      setMode('consent')
    } else {
      setMode('run')
    }
  }

  const handleComplete = async () => {
    if (!profile) return
    const answerArray = questions.map(q => ({
      question_id: q.id,
      question: q.question_text,
      answer: answers[q.id] || '',
    }))

    const { data: patientRec } = await supabase
      .from('patients')
      .select('id')
      .eq('profile_id', profile.id)
      .single()

    const { error } = await supabase.from('diagnostic_results').insert({
      patient_id: patientRec?.id,
      answers: answerArray,
      summary: `Diagnostika dokončená ${new Date().toLocaleDateString('sk')} (${answerArray.length} otázok)`,
    })

    if (error) {
      showToast('error', 'Chyba pri ukladaní')
    } else {
      showToast('success', 'Diagnostika dokončená')
      setMode('list')
      setAnswers({})
    }
  }

  if (loading) return null

  // ---- Health consent screen ----
  if (mode === 'consent') {
    return (
      <div className="animate-fade-in">
        <Header title="Diagnostika" />
        <div className="px-4 mt-4">
          <Card>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Zdravotné údaje</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Táto diagnostika obsahuje otázky týkajúce sa Vášho zdravotného stavu. 
                    Na spracovanie týchto údajov potrebujeme Váš explicitný súhlas podľa GDPR Čl. 9.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={healthConsent}
                  onChange={(e) => setHealthConsent(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  Súhlasím so spracovaním zdravotných údajov na účely diagnostiky a terapie
                </span>
              </label>

              <Button
                fullWidth
                disabled={!healthConsent}
                onClick={() => {
                  // Log consent
                  if (profile) {
                    supabase.rpc('log_consent', {
                      p_profile_id: profile.id,
                      p_consent_type: 'gdpr_health',
                      p_action: 'granted',
                      p_document_version: 'v1.0',
                      p_ip_address: '0.0.0.0',
                    })
                  }
                  setMode('run')
                }}
              >
                Pokračovať
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ---- Run diagnostics ----
  if (mode === 'run') {
    const steps = questions.map((q, i) => ({
      id: q.id,
      title: `Otázka ${i + 1}`,
      content: (
        <div className="mt-3 animate-scale-in">
          <p className="text-base font-medium text-gray-900 mb-4">{q.question_text}</p>

          {q.is_health && (
            <div className="flex items-center gap-2 mb-3 bg-amber-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-700">Zdravotný údaj</span>
            </div>
          )}

          {q.question_type === 'text' && (
            <textarea
              className="w-full h-24 p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="Vaša odpoveď..."
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            />
          )}

          {q.question_type === 'bool' && (
            <div className="flex gap-3">
              {['Áno', 'Nie'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`flex-1 h-12 rounded-xl font-medium transition-all active:scale-[0.97] ${
                    answers[q.id] === opt
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.question_type === 'choice' && q.choices && (
            <div className="space-y-2">
              {q.choices.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`w-full h-12 rounded-xl font-medium text-sm transition-all active:scale-[0.97] text-left px-4 ${
                    answers[q.id] === opt
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {(q.question_type === 'scale_1_10' || q.question_type === 'scale_1_5') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">1 (minimum)</span>
                <span className="text-sm font-bold text-blue-600">{answers[q.id] || '—'}</span>
                <span className="text-xs text-gray-400">{q.question_type === 'scale_1_10' ? '10' : '5'} (maximum)</span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: q.question_type === 'scale_1_10' ? 10 : 5 }, (_, i) => i + 1).map(val => (
                  <button
                    key={val}
                    onClick={() => setAnswers({ ...answers, [q.id]: val })}
                    className={`flex-1 aspect-square rounded-lg text-xs font-medium transition-all active:scale-90 ${
                      answers[q.id] === val
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    }))

    return (
      <div className="animate-fade-in h-screen flex flex-col">
        <Header title="Diagnostika" onBack={() => setMode('list')} />
        <div className="flex-1">
          <StepWizard steps={steps} onComplete={handleComplete} />
        </div>
      </div>
    )
  }

  // ---- Results list ----
  return (
    <div className="animate-fade-in pb-4">
      <Header title="Diagnostika" />

      <div className="px-4 space-y-3 mt-4">
        <Button
          fullWidth
          onClick={handleStart}
          className="mb-2"
        >
          <Activity className="w-4 h-4 mr-2" />
          Spustiť diagnostiku
        </Button>

        {results.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                Zatiaľ ste nevykonali žiadnu diagnostiku
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Po spustení prejdete sériou otázok o Vašom zdravotnom stave a kondícii
              </p>
            </CardContent>
          </Card>
        ) : (
          results.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(r.completed_at).toLocaleDateString('sk')}
                  </p>
                  <p className="text-xs text-gray-400">{r.summary?.slice(0, 60)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-5 pt-6 pb-6 rounded-b-3xl shadow-lg">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-lg">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
    </div>
  )
}