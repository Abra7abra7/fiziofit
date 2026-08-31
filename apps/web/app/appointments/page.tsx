'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useApp } from '@/lib/context'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Calendar from '@/components/ui/Calendar'
import TimeSlots from '@/components/ui/TimeSlots'
import Avatar from '@/components/ui/Avatar'
import { showToast } from '@/components/ui/Toast'
import { Plus, CalendarDays, ChevronRight, Clock, User, Stethoscope, Dumbbell, Activity } from 'lucide-react'

type Step = 'type' | 'staff' | 'date' | 'time' | 'confirm'

const APPT_TYPES = [
  { id: 'doctor', label: 'Doktor', icon: <Stethoscope className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700' },
  { id: 'physio', label: 'Fyzioterapeut', icon: <Activity className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700' },
  { id: 'trainer', label: 'Tréner', icon: <Dumbbell className="w-5 h-5" />, color: 'bg-green-100 text-green-700' },
]

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
]

export default function AppointmentsPage() {
  const { profile, loading } = useApp()
  const router = useRouter()
  const [step, setStep] = useState<Step>('type')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [appointments, setAppointments] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !profile?.id) router.push('/login')
  }, [loading, profile])

  // Load appointments
  useEffect(() => {
    if (!profile) return
    const load = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_date', { ascending: false })
        .limit(20)
      setAppointments(data || [])
    }
    load()
  }, [profile])

  // Load staff when type selected
  useEffect(() => {
    if (!selectedType) return
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, staff!inner(id, specialization, work_hours)')
        .eq('role', selectedType)
      setStaffList(data || [])
    }
    load()
  }, [selectedType])

  const handleBook = async () => {
    if (!profile || !selectedDate || !selectedTime || !selectedStaff) {
      showToast('error', 'Vyplňte všetky údaje')
      return
    }

    const { data: patientRec } = await supabase
      .from('patients')
      .select('id')
      .eq('profile_id', profile.id)
      .single()

    const { data: staffRec } = await supabase
      .from('staff')
      .select('id')
      .eq('profile_id', selectedStaff)
      .single()

    if (!patientRec || !staffRec) {
      showToast('error', 'Chyba pri rezervácii')
      return
    }

    const { error } = await supabase.from('appointments').insert({
      patient_id: patientRec.id,
      staff_id: staffRec.id,
      appointment_type: selectedType,
      scheduled_date: selectedDate.toISOString().split('T')[0],
      scheduled_time: selectedTime,
      status: 'pending',
    })

    if (error) {
      showToast('error', 'Chyba pri ukladaní')
    } else {
      showToast('success', 'Rezervácia vytvorená')
      setStep('type')
      setSelectedType('')
      setSelectedStaff('')
      setSelectedDate(null)
      setSelectedTime('')
    }
  }

  if (loading) return null

  // ----- New booking flow -----
  if (step !== 'type') {
    return (
      <div className="animate-fade-in">
        <Header title="Nová rezervácia" onBack={() => setStep('type')} />

        <div className="px-4 space-y-3 mt-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {['type', 'staff', 'date', 'time', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-blue-600 text-white' : 
                  ['type','staff','date','time','confirm'].indexOf(step) > i ? 'bg-green-500 text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {['type','staff','date','time','confirm'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 4 && <div className="h-0.5 flex-1 bg-gray-100 last:hidden" />}
              </div>
            ))}
          </div>

          {step === 'staff' && (
            <>
              <h2 className="font-semibold text-gray-900 text-lg">Vyberte odborníka</h2>
              <p className="text-sm text-gray-400">Vybrať {APPT_TYPES.find(t => t.id === selectedType)?.label?.toLowerCase()}</p>
              <div className="space-y-2">
                {staffList.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">Načítavam...</p>
                ) : staffList.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStaff(s.id); setStep('date') }}
                    className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-all text-left"
                  >
                    <Avatar name={s.full_name} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{s.full_name}</p>
                      <p className="text-xs text-gray-400">{s.specialization || selectedType}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'date' && (
            <>
              <h2 className="font-semibold text-gray-900 text-lg">Vyberte dátum</h2>
              <Calendar
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setStep('time') }}
                minDate={new Date()}
              />
            </>
          )}

          {step === 'time' && selectedDate && (
            <>
              <h2 className="font-semibold text-gray-900 text-lg">Vyberte čas</h2>
              <p className="text-sm text-gray-400">{selectedDate.toLocaleDateString('sk')}</p>
              <TimeSlots
                slots={TIME_SLOTS}
                selected={selectedTime}
                onSelect={(t) => { setSelectedTime(t); setStep('confirm') }}
              />
            </>
          )}

          {step === 'confirm' && (
            <>
              <h2 className="font-semibold text-gray-900 text-lg">Potvrdenie</h2>
              <Card>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-500">Typ: </span>
                    <span className="font-medium">{APPT_TYPES.find(t => t.id === selectedType)?.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-500">Dátum: </span>
                    <span className="font-medium">{selectedDate?.toLocaleDateString('sk')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-500">Čas: </span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                </CardContent>
              </Card>
              <Button fullWidth onClick={handleBook}>
                Potvrdiť rezerváciu
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ----- Appointment list -----
  return (
    <div className="animate-fade-in">
      <Header title="Termíny" />

      <div className="px-4 space-y-3 mt-4">
        <Button
          fullWidth
          onClick={() => setStep('staff')}
          className="mb-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nová rezervácia
        </Button>

        {/* Upcoming */}
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Zatiaľ nemáte žiadne rezervácie</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {new Date(a.scheduled_date).getDate()}
                  </span>
                  <span className="text-[10px] text-blue-400">
                    {new Date(a.scheduled_date).toLocaleString('sk', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {a.appointment_type === 'doctor' && 'Lekár'}
                    {a.appointment_type === 'physio' && 'Fyzioterapia'}
                    {a.appointment_type === 'trainer' && 'Tréning'}
                  </p>
                  <p className="text-xs text-gray-400">{a.scheduled_time}</p>
                </div>
                <span className={`badge-${a.status} text-xs px-2.5 py-1 rounded-full`}>
                  {a.status === 'confirmed' && 'Potvrdený'}
                  {a.status === 'pending' && 'Čaká'}
                  {a.status === 'completed' && 'Dokončený'}
                  {a.status === 'cancelled' && 'Zrušený'}
                </span>
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