import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthListener } from '@/lib/auth'
import { AppProvider } from '@/lib/context'
import MobileLayout from '@/components/MobileLayout'
import { ToastContainer } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FizioFit — Systém pre fyzioterapiu a tréningy',
  description: 'Kompletný systém pre správu fyzioterapeutického centra, rezervácie, diagnostiku a tréningové plány',
  manifest: '/manifest.json',
  themeColor: '#0066cc',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FizioFit',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <AppProvider>
          <AuthListener>
            <MobileLayout>
              {children}
            </MobileLayout>
          </AuthListener>
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  )
}