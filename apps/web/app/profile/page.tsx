'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useApp } from '@/lib/context'
import { useAuth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { showToast } from '@/components/ui/Toast'
import { ChevronRight, User, Shield, FileText, LogOut, Trash2, Mail, Phone, CalendarDays, Settings } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { profile } = useApp()
  const router = useRouter()
  const { signOut } = useAuth()
  const supabase = createClient()
  const [showLogout, setShowLogout] = useState(false)

  if (!profile) return null

  const roleLabels: Record<string, string> = {
    patient: 'Pacient',
    doctor: 'Doktor',
    physio: 'Fyzioterapeut',
    trainer: 'Tréner',
    admin: 'Admin',
  }

  const menuItems = [
    { icon: <User className="w-5 h-5 text-blue-500" />, label: 'Osobné údaje', href: '' },
    { icon: <Shield className="w-5 h-5 text-purple-500" />, label: 'Ochrana údajov', href: '/consents' },
    { icon: <FileText className="w-5 h-5 text-green-500" />, label: 'Súhlasy', href: '/consents' },
    { icon: <Settings className="w-5 h-5 text-gray-500" />, label: 'Nastavenia', href: '' },
  ]

  const handleDeleteAccount = async () => {
    if (!confirm('Naozaj chcete odstrániť účet? Táto akcia je nezvratná.')) return

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').delete().eq('id', user.id)
      await supabase.auth.signOut()
      router.push('/')
      showToast('success', 'Účet odstránený')
    }
  }

  const handleLogout = async () => {
    showToast('info', 'Odhlásenie...')
    await signOut()
  }

  return (
    <div className="animate-fade-in">
      {/* Cover */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-5 pt-10 pb-20 rounded-b-3xl shadow-lg text-center">
        <div className="flex justify-center mb-3">
          <Avatar name={profile.full_name} size="lg" url={profile.avatar_url} />
        </div>
        <h1 className="text-white text-xl font-bold">{profile.full_name}</h1>
        <p className="text-blue-100 text-sm">{profile.email}</p>
        <span className="inline-block mt-2 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
          {roleLabels[profile.role] || profile.role}
        </span>
      </div>

      {/* Content over cover */}
      <div className="px-4 -mt-12 space-y-3">
        {/* Info card */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{profile.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Menu */}
        <Card>
          <CardContent className="space-y-1">
            {menuItems.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-900">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2 pt-4">
          <Button
            variant="danger"
            fullWidth
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Odhlásiť sa
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={handleDeleteAccount}
            className="text-red-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Odstrániť účet
          </Button>
        </div>
      </div>
    </div>
  )
}