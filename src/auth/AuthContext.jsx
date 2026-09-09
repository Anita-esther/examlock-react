import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { normalizeClaims } from '../lib/roles';

const AuthContext = createContext(null);

async function buildClaimsForUser(user) {
  const [{ data: profile, error: profileErr }, { data: roleRows, error: roleErr }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profile_roles').select('role').eq('profile_id', user.id)
  ]);
  if (profileErr) throw new Error(`Could not load your ExamsLock profile: ${profileErr.message}`);
  if (roleErr) throw new Error(`Could not load your roles: ${roleErr.message}`);
  if (profile?.active === false) throw new Error('This account has been deactivated. Contact your institutional administrator.');
  return normalizeClaims({ user, profile, roles: (roleRows || []).map(r => r.role) });
}

export function AuthProvider({ children }) {
  const [claims, setClaims] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data?.session?.user) {
        try {
          const c = await buildClaimsForUser(data.session.user);
          setClaims(c);
          setActiveRole(c.primaryRole);
        } catch (e) { setError(e.message); }
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) { setClaims(null); setActiveRole(null); return; }
      try {
        const c = await buildClaimsForUser(session.user);
        setClaims(c);
        setActiveRole(c.primaryRole);
      } catch (e) { setError(e.message); }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(signInError.message);
    const c = await buildClaimsForUser(data.user);
    setClaims(c);
    setActiveRole(c.primaryRole);
    return c;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setClaims(null);
    setActiveRole(null);
  }, []);

  const value = useMemo(() => ({
    claims, activeRole, setActiveRole, loading, error, signIn, signOut,
    isAuthenticated: !!claims
  }), [claims, activeRole, loading, error, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
