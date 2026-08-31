'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useApp } from '@/lib/context'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import { Dumbbell, Plus, CheckCircle, ChevronRight, Target, Flame, Clock } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  muscle_group: string[]
  exercise_type: string
  instructions: string
}

export default function ExercisesPage() {
  const { profile, loading } = useApp()
  const router = useRouter()
  const supabase = createClient()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [logEntry, setLogEntry] = useState({ sets: 3, reps: 10, weight: 0, rpe: 7, note: '' })

  useEffect(() => {
    if (!loading && !profile?.id) router.push('/login')
  }, [loading, profile])

  useEffect(() => {
    supabase.from('exercise_library')
      .select('*')
      .eq('is_public', true)
      .order('name')
      .then(({ data }) => setExercises(data || []))
  }, [])

  // Role-specific view
  if (profile?.role === 'patient') return <PatientExercises />
  if (profile?.role === 'physio') return <PhysioExercises />
  if (profile?.role === 'trainer') return <TrainerLog exercises={exercises} />
  return <StaffExercises exercises={exercises} />
}

function PatientExercises() {
  return (
    <div className="animate-fade-in">
      <Header title="Moje cvičenia" />
      <div className="px-4 mt-4 space-y-3">
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-3">Dnešný program</h3>
            <div className="space-y-3">
              {[
                { name: 'Mostík', sets: 3, reps: 12, done: false },
                { name: 'Plank', sets: 3, reps: 30, done: true, unit: 's' },
                { name: 'Stahovanie lopatiek', sets: 3, reps: 10, done: false },
                { name: 'Rotácia trupu', sets: 2, reps: 8, done: true },
              ].map((ex, i) => (
                <div key={i} className="flex items-center gap-3 pb-2 border-b border-gray-50 last:border-0">
                  <button className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    ex.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                  }`}>
                    {ex.done && <CheckCircle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                    <p className="text-xs text-gray-400">{ex.sets} × {ex.reps}{ex.unit || ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${ex.done ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                    {ex.done ? 'Hotovo' : 'Čaká'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ProgressSummary />
      </div>
    </div>
  )
}

function PhysioExercises() {
  const todayClients = [
    { id: '1', name: 'Mária Kováčová', time: '10:00', exercises: 5, pain: 3 },
    { id: '2', name: 'Peter Horváth', time: '11:00', exercises: 4, pain: 6 },
    { id: '3', name: 'Jana Biela', time: '13:00', exercises: 6, pain: 2 },
  ]

  return (
    <div className="animate-fade-in">
      <Header title="Fyzioterapia" />
      <div className="px-4 mt-4 space-y-3">
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-3">Dnešní pacienti</h3>
            <div className="space-y-3">
              {todayClients.map((c, i) => (
                <button key={c.id} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98] text-left">
                  <Avatar name={c.name} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.time} — {c.exercises} cvikov</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    c.pain >= 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    Bolesť: {c.pain}/10
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TrainerLog({ exercises }: { exercises: Exercise[] }) {
  const [todayLogs, setTodayLogs] = useState<any[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [logEntry, setLogEntry] = useState({ sets: 3, reps: 10, weight: 0, rpe: 7, note: '' })
  const supabase = createClient()

  useEffect(() => {
    supabase.from('training_logs')
      .select('*, exercise:exercise_library(name)')
      .eq('performed_at', new Date().toISOString().split('T')[0])
      .then(({ data }) => setTodayLogs(data || []))
  }, [])

  const logExercise = async () => {
    if (!selectedExercise) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: staffRec } = await supabase.from('staff').select('id').eq('profile_id', user.id).single()
    const { data: plan } = await supabase.from('training_plans').select('id').limit(1).single()

    if (!plan || !staffRec) {
      showToast('error', 'Chyba pri logovaní')
      return
    }

    const { error } = await supabase.from('training_logs').insert({
      plan_id: plan.id,
      exercise_id: selectedExercise.id,
      patient_id: '00000000-0000-0000-0000-000000000000', // TODO: real patient
      set_number: logEntry.sets,
      reps: logEntry.reps,
      weight_kg: logEntry.weight,
      rpe: logEntry.rpe,
      notes: logEntry.note,
    })

    if (error) {
      showToast('error', 'Chyba')
    } else {
      showToast('success', 'Cvik zalogovaný')
      setShowLogModal(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <Header title="Tréningový denník" />
      <div className="px-4 mt-4 space-y-3">
        {/* Quick stats */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <Flame className="w-5 h-5 text-orange-500 mb-1" />
            <p className="text-lg font-bold text-gray-900">845</p>
            <p className="text-xs text-gray-400">kcal dnes</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <Target className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-lg font-bold text-gray-900">{todayLogs.length}</p>
            <p className="text-xs text-gray-400">cvikov dnes</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <Clock className="w-5 h-5 text-green-500 mb-1" />
            <p className="text-lg font-bold text-gray-900">45</p>
            <p className="text-xs text-gray-400">minút</p>
          </div>
        </div>

        {/* Exercise categories */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {['Všetky', 'Silové', 'Rehab', 'Kardio', 'Mobilita'].map(cat => (
            <button key={cat} className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium transition-colors ${
              cat === 'Všetky' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Exercise library */}
        <div className="space-y-2">
          {exercises.map((ex) => (
            <Card key={ex.id}>
              <CardContent
                className="flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => { setSelectedExercise(ex); setShowLogModal(true) }}
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                  <p className="text-xs text-gray-400">{ex.muscle_group?.join(', ')}</p>
                </div>
                <Plus className="w-5 h-5 text-gray-300" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Log modal */}
      <Modal open={showLogModal} onClose={() => setShowLogModal(false)} title={selectedExercise?.name}>
        <div className="space-y-4">
          {['sets', 'reps', 'weight', 'rpe'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field === 'sets' ? 'Série' : field === 'reps' ? 'Opakovania' : field === 'weight' ? 'Váha (kg)' : 'RPE (1-10)'}
              </label>
              <input
                type="number"
                value={(logEntry as any)[field]}
                onChange={(e) => setLogEntry({ ...logEntry, [field]: Number(e.target.value) })}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                min={0}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poznámka</label>
            <textarea
              value={logEntry.note}
              onChange={(e) => setLogEntry({ ...logEntry, note: e.target.value })}
              className="w-full h-20 p-3 border border-gray-200 rounded-xl resize-none text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Technika, bolesť, poznámky..."
            />
          </div>
          <Button fullWidth onClick={logExercise}>
            Uložiť záznam
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function StaffExercises({ exercises }: { exercises: Exercise[] }) {
  return <TrainerLog exercises={exercises} />
}

function ProgressSummary() {
  return (
    <Card>
      <CardContent>
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Týždenný prehľad</h3>
        <div className="grid grid-cols-7 gap-1">
          {['Po','Ut','St','Št','Pi','So','Ne'].map((day, i) => {
            const done = [true, true, false, true, true, false, false][i]
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{day}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {done ? '✓' : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Using the same Header component pattern
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