import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * AuthContext — session + live token balance for the whole app.
 *
 * The token balance is read from the caller's OWN profile row
 * (allowed by the "profiles: read own" RLS policy) and can only be
 * changed by the RPCs — so this value is always the server's truth.
 *
 * Usage:
 *   <AuthProvider> ... </AuthProvider>
 *   const { user, tokenBalance, refreshBalance } = useAuth()
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // { full_name, role, token_balance }
  const [ready, setReady] = useState(false)

  const loadProfile = useCallback(async (uid) => {
    // maybeSingle(): profile is created by the handle_new_user DB
    // trigger; if the trigger is not deployed yet this returns null.
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role, token_balance')
      .eq('id', uid)
      .maybeSingle()
    setProfile(data || null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) loadProfile(data.session.user.id)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        if (newSession?.user) loadProfile(newSession.user.id)
        else setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [loadProfile])

  /** Re-fetch the balance after an unlock / refund / top-up. */
  const refreshBalance = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  const value = useMemo(
    () => ({
      user: session?.user || null,
      profile,
      tokenBalance: profile?.token_balance ?? null,
      isAdmin: profile?.role === 'admin',
      isSeller: profile?.role === 'seller' || profile?.role === 'admin',
      ready,
      refreshBalance,
    }),
    [session, profile, ready, refreshBalance]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
