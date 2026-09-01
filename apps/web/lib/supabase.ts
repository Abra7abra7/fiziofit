// Polyfill: crypto.randomUUID nie je dostupný cez HTTP (non-secure context)
// @supabase/ssr a PKCE flow ho vyžadujú — bez neho signup/login padá.
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _uuid = crypto.randomUUID // reference to shut TS up
  crypto.randomUUID = function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    }) as `${string}-${string}-${string}-${string}-${string}`
  }
}

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type SupabaseClient = ReturnType<typeof createClient>