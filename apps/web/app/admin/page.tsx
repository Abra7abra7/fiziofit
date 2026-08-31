'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useApp } from '@/lib/context'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import { Users, Activity, MessageSquare, Dumbbell, ChevronRight, Trash2, Shield, AlertCircle } from 'lucide-react'

export default function AdminPage() {
  const { profile, loading } = useApp()
  const router = useRouter()
  const supabase = createClient()
  const [section, setSection] = useState<'users' | 'questions' | 'exercises'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [showDelete, setShowDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
  }, [loading, profile])

  useEffect(() => {
    if (section === 'users') {
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setUsers(data || []))
    }
  }, [section])

  const handleDeleteUser = async (id: string) => {
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Používateľ odstránený')
      setUsers(users.filter(u => u.id !== id))
    }
    setShowDelete(null)
  }

  if (loading) return null

  return (
    <div className="animate-fade-in">
      <Header title="Admin panel" />

      {/* Navigation tabs */}
      <div className="px-4 mt-4">
        <div className="bg-gray-100 rounded-xl p-1 flex">
          {[
            { id: 'users', label: 'Používatelia', icon: <Users className="w-4 h-4" /> },
            { id: 'questions', label: 'Otázky', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'exercises', label: 'Cviky', icon: <Dumbbell className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id as any)}
              className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                section === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section content */}
      <div className="px-4 mt-4 space-y-3 pb-8">
        {section === 'users' && (
          <>
            {users.map((u: any) => (
              <Card key={u.id}>
                <CardContent className="flex items-center gap-3">
                  <Avatar name={u.full_name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                  </div>
                  <button
                    onClick={() => setShowDelete(u.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}

            <Modal open={!!showDelete} onClose={() => setShowDelete(null)} title="Odstrániť používateľa?">
              <div className="space-y-4">
                <div className="bg-red-50 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">Táto akcia je nezvratná. Všetky dáta používateľa budú odstránené.</p>
                </div>
                <Button variant="danger" fullWidth onClick={() => handleDeleteUser(showDelete!)}>
                  Odstrániť
                </Button>
              </div>
            </Modal>
          </>
        )}

        {section === 'questions' && (
          <AdminQuestions />
        )}

        {section === 'exercises' && (
          <AdminExercises />
        )}
      </div>
    </div>
  )
}

function AdminQuestions() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newQ, setNewQ] = useState({ question_text: '', question_type: 'text', category: 'initial', step_order: 0, is_health: false })

  useEffect(() => {
    supabase.from('diagnostic_questions').select('*').order('step_order').then(({ data }) => setQuestions(data || []))
  }, [])

  const handleAdd = async () => {
    if (!newQ.question_text.trim()) return
    const { error } = await supabase.from('diagnostic_questions').insert(newQ)
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Otázka pridaná')
      setShowAdd(false)
      setNewQ({ question_text: '', question_type: 'text', category: 'initial', step_order: 0, is_health: false })
    }
  }

  return (
    <div className="space-y-3">
      <Button fullWidth onClick={() => setShowAdd(true)}>
        Pridať otázku
      </Button>

      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
              {q.step_order}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{q.question_text}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{q.question_type}</span>
                <span className="text-[10x] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{q.category}</span>
                {q.is_health && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Zdravotná
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nová diagnostická otázka">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Otázka</label>
            <input
              value={newQ.question_text}
              onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <select
                value={newQ.question_type}
                onChange={(e) => setNewQ({ ...newQ, question_type: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="text">Text</option>
                <option value="choice">Výber</option>
                <option value="scale_1_10">Škála 1-10</option>
                <option value="scale_1_5">Škála 1-5</option>
                <option value="bool">Áno/Nie</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategória</label>
              <select
                value={newQ.category}
                onChange={(e) => setNewQ({ ...newQ, category: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="initial">Vstupná</option>
                <option value="movement">Pohyb</option>
                <option value="pain">Bolesť</option>
                <option value="lifestyle">Životný štýl</option>
                <option value="goals">Ciele</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newQ.is_health}
              onChange={(e) => setNewQ({ ...newQ, is_health: e.target.checked })}
            />
            <span className="text-sm text-gray-700">Zdravotný údaj (vyžaduje Čl. 9 súhlas)</span>
          </label>
          <Button fullWidth onClick={handleAdd}>Pridať</Button>
        </div>
      </Modal>
    </div>
  )
}

function AdminExercises() {
  const supabase = createClient()
  const [exercises, setExercises] = useState<any[]>([])

  useEffect(() => {
    supabase.from('exercise_library').select('*').order('name').then(({ data }) => setExercises(data || []))
  }, [])

  return (
    <div className="space-y-2">
      {exercises.map((ex: any) => (
        <Card key={ex.id}>
          <CardContent className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{ex.name}</p>
              <p className="text-xs text-gray-400">{ex.exercise_type} · {ex.muscle_group?.join(', ')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function Header({ title }: { title: string }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-5 pt-6 pb-6 rounded-b-3xl shadow-lg">
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  )
}