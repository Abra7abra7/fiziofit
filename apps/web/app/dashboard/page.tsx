'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useApp } from '@/lib/context'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import ProgressChart from '@/components/ui/ProgressChart'
import { Calendar, Dumbbell, Activity, ChevronRight, Clock, User, AlertCircle, ClipboardList } from 'lucide-react'

export default function DashboardPage() {
  const { profile, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !profile) router.push('/login')
  }, [loading, profile, router])

  if (loading) return <LoadingScreen />
  if (!profile) return null

  const roleDashboards: Record<string, React.ReactNode> = {
    patient: <PatientDashboard />,
    doctor: <StaffDashboard title="Doktor" type="doctor" />,
    physio: <StaffDashboard title="Fyzioterapeut" type="physio" />,
    trainer: <TrainerDashboard />,
    admin: <AdminDashboard />,
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <Header profile={profile} />

      {/* Role-specific dashboard */}
      {roleDashboards[profile.role] || <PatientDashboard />}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Načítavam...</p>
    </div>
  )
}

function Header({ profile }: { profile: any }) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Dobré ráno'
    if (hour < 18) return 'Dobrý deň'
    return 'Dobrý večer'
  }

  const roleLabels: Record<string, string> = {
    patient: 'Pacient',
    doctor: 'Doktor',
    physio: 'Fyzioterapeut',
    trainer: 'Tréner',
    admin: 'Admin',
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-5 pt-6 pb-8 rounded-b-3xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={profile.full_name} size="lg" />
          <div>
            <p className="text-blue-100 text-sm">{getGreeting()}</p>
            <h1 className="text-lg font-bold">{profile.full_name}</h1>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {roleLabels[profile.role] || profile.role}
            </span>
          </div>
        </div>
      </div>
      <p className="text-blue-100 text-sm">Vitajte v systéme FizioFit</p>
    </div>
  )
}

// ============== PATIENT ==============
function PatientDashboard() {
  const supabase = createClient()
  const { profile } = useApp()
  const [nextAppt, setNextAppt] = useState<any>(null)
  const [todayExercises, setTodayExercises] = useState(0)
  const [hasDiagnostic, setHasDiagnostic] = useState(false)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      const { data: appts } = await supabase
        .from('appointments')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .order('scheduled_date', { ascending: true })
        .limit(1)

      if (appts && appts.length > 0) setNextAppt(appts[0])

      // Zatial mock data
      setTodayExercises(5)
      setHasDiagnostic(true)
    }
    load()
  }, [profile])

  return (
    <div className="px-4 -mt-4 space-y-3">
      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={<Calendar className="w-6 h-6" />} label="Rezervovať" color="bg-blue-500" onClick={() => {}} />
        <QuickAction icon={<Activity className="w-6 h-6" />} label="Diagnostika" color="bg-purple-500" onClick={() => {}} />
        <QuickAction icon={<Dumbbell className="w-6 h-6" />} label="Cvičenia" color="bg-green-500" onClick={() => {}} />
        <QuickAction icon={<User className="w-6 h-6" />} label="Profil" color="bg-amber-500" onClick={() => {}} />
      </div>

      {/* Next appointment */}
      {nextAppt && (
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Najbližší termín</p>
              <p className="text-xs text-gray-500">
                {new Date(nextAppt.scheduled_date).toLocaleDateString('sk')} o {nextAppt.scheduled_time}
              </p>
            </div>
            <span className={`badge-${nextAppt.status} text-xs px-2 py-1 rounded-full`}>
              {nextAppt.status === 'confirmed' ? 'Potvrdený' : 'Čaká'}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Today's overview */}
      <Card>
        <CardContent className="space-y-3">
          <h3 className="font-semibold text-gray-900">Dnešný prehľad</h3>
          <div className="flex gap-4">
            <StatBox icon={<Dumbbell className="w-5 h-5 text-green-600" />} value="5" label="Cvičení dnes" />
            <StatBox icon={<Clock className="w-5 h-5 text-blue-600" />} value="2" label="Zostávajúce" />
            <StatBox icon={<AlertCircle className="w-5 h-5 text-amber-600" />} value={hasDiagnostic ? '1' : '0'} label="Diagnostika" />
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <ProgressChart
        title="Cvičenia za posledný týždeň"
        data={[
          { date: 'Po', value: 3 },
          { date: 'Ut', value: 5 },
          { date: 'St', value: 2 },
          { date: 'Št', value: 6 },
          { date: 'Pi', value: 4 },
          { date: 'So', value: 7 },
          { date: 'Ne', value: 1 },
        ]}
        unit="cviky"
      />
    </div>
  )
}

// ============== STAFF (doctor, physio) ==============
function StaffDashboard({ title, type }: { title: string; type: string }) {
  const supabase = createClient()
  const [todayCount, setTodayCount] = useState(0)
  const [pendingTasks, setPendingTasks] = useState(3)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: staffRec } = await supabase.from('staff').select('id').eq('profile_id', user.id).single()
      if (staffRec) {
        const { data: appts } = await supabase
          .from('appointments')
          .select('id')
          .eq('staff_id', staffRec.id)
          .eq('scheduled_date', new Date().toISOString().split('T')[0])
        setTodayCount(appts?.length || 0)
      }
    }
    load()
  }, [])

  return (
    <div className="px-4 -mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={<Calendar className="w-6 h-6" />} label="Dnešní pacienti" color="bg-blue-500" sub={todayCount.toString()} />
        <QuickAction icon={<ClipboardList className="w-6 h-6" />} label="Čaká" color="bg-amber-500" sub={pendingTasks.toString()} />
      </div>
      
      <Card>
        <CardContent>
          <h3 className="font-semibold text-gray-900 mb-3">{title} — denný prehľad</h3>
          <div className="flex gap-3">
            <StatBox icon={<User className="w-5 h-5 text-blue-600" />} value={todayCount.toString()} label="Pacienti dnes" />
            <StatBox icon={<Clock className="w-5 h-5 text-green-600" />} value="8" label="Voľné sloty" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============== TRAINER ==============
function TrainerDashboard() {
  const [todayClients] = useState(4)

  return (
    <div className="px-4 -mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={<User className="w-6 h-6" />} label="Moji klienti" color="bg-green-500" sub="12" />
        <QuickAction icon={<Dumbbell className="w-6 h-6" />} label="Tréningy dnes" color="bg-blue-500" sub={todayClients.toString()} />
      </div>

      <Card>
        <CardContent>
          <h3 className="font-semibold text-gray-900 mb-3">Dnešný program</h3>
          <div className="space-y-3">
            {['08:00 Ján Mrkvička', '09:30 Petra Nováková', '11:00 Lukáš Kováč', '14:00 Eva Malá'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {item.split(' ')[0].slice(0, 5)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.slice(6)}</p>
                  <p className="text-xs text-gray-400">Funkčný tréning</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============== ADMIN ==============
function AdminDashboard() {
  return (
    <div className="px-4 -mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={<User className="w-6 h-6" />} label="Používatelia" color="bg-blue-500" sub="45" />
        <QuickAction icon={<Calendar className="w-6 h-6" />} label="Rezervácie dnes" color="bg-purple-500" sub="18" />
        <QuickAction icon={<Activity className="w-6 h-6" />} label="Diagnostické otázky" color="bg-green-500" sub="12" />
        <QuickAction icon={<Dumbbell className="w-6 h-6" />} label="Cviky" color="bg-amber-500" sub="48" />
      </div>

      <Card>
        <CardContent>
          <h3 className="font-semibold text-gray-900 mb-2">Rýchla štatistika</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-green-50 p-3 rounded-xl">
              <p className="text-2xl font-bold text-green-700">24</p>
              <p className="text-green-600 text-xs">Aktívni pacienti</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <p className="text-2xl font-bold text-blue-700">8</p>
              <p className="text-blue-600 text-xs">Personál</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl">
              <p className="text-2xl font-bold text-amber-700">12</p>
              <p className="text-amber-600 text-xs">Dnešné rezervácie</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <p className="text-2xl font-bold text-purple-700">3</p>
              <p className="text-purple-600 text-xs">Nové registrácie</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============== COMPONENTS ==============
function QuickAction({ icon, label, color, sub, onClick }: { icon: React.ReactNode; label: string; color: string; sub?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="bg-white rounded-xl shadow-sm p-4 active:scale-[0.97] transition-all text-left">
      <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-2`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {sub !== undefined && <p className="text-xs text-gray-400">{sub}</p>}
    </button>
  )
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 flex-1">
      {icon}
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
    </div>
  )
}