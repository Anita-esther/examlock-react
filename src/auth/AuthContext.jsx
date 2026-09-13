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

// Decides whether the current session needs an MFA step-up before we treat the user as fully
// signed in. If they have a verified TOTP factor and haven't cleared it this session (AAL2),
// claims are withheld and mfaPending/mfaFactorId are surfaced instead so the login screen can
// show the code-entry step. Sessions with no enrolled factor, or already at AAL2, proceed as before.
async function resolveSessionState(user) {
  const { data: aal, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalErr) throw new Error(aalErr.message);

  const needsStepUp = aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2';
  if (needsStepUp) {
    const { data: factorsData, error: factorsErr } = await supabase.auth.mfa.listFactors();
    if (factorsErr) throw new Error(factorsErr.message);
    const factor = factorsData?.totp?.[0] ?? null;
    return { mfaPending: true, mfaFactorId: factor?.id ?? null, claims: null };
  }

  const claims = await buildClaimsForUser(user);
  return { mfaPending: false, mfaFactorId: null, claims };
}

export function AuthProvider({ children }) {
  const [claims, setClaims] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState(null);

  const applyState = useCallback((state) => {
    setMfaPending(state.mfaPending);
    setMfaFactorId(state.mfaFactorId);
    if (state.claims) {
      setClaims(state.claims);
      setActiveRole(state.claims.primaryRole);
    } else {
      setClaims(null);
      setActiveRole(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data?.session?.user) {
        try {
          applyState(await resolveSessionState(data.session.user));
        } catch (e) { setError(e.message); }
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) { setClaims(null); setActiveRole(null); setMfaPending(false); setMfaFactorId(null); return; }
      try {
        applyState(await resolveSessionState(session.user));
      } catch (e) { setError(e.message); }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [applyState]);

  const signIn = useCallback(async (email, password) => {
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(signInError.message);
    const state = await resolveSessionState(data.user);
    applyState(state);
    if (state.mfaPending) return { mfaRequired: true };
    return state.claims;
  }, [applyState]);

  // Completes the step-up challenge for the factor found at sign-in. On success the session is
  // promoted to AAL2 and claims are built exactly as a normal sign-in would.
  const verifyMfaCode = useCallback(async (code) => {
    if (!mfaFactorId) throw new Error('No pending authenticator challenge for this session.');
    const { data, error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code });
    if (verifyErr) throw new Error(verifyErr.message);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) throw new Error(userErr?.message || 'Could not confirm your session after verification.');
    const claims = await buildClaimsForUser(userData.user);
    setMfaPending(false);
    setMfaFactorId(null);
    setClaims(claims);
    setActiveRole(claims.primaryRole);
    return claims;
  }, [mfaFactorId]);

  // Abandons a pending MFA challenge — fully signs the (AAL1-only) session out rather than
  // leaving a half-authenticated session sitting in local storage.
  const cancelMfaLogin = useCallback(async () => {
    await supabase.auth.signOut();
    setMfaPending(false);
    setMfaFactorId(null);
    setClaims(null);
    setActiveRole(null);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setClaims(null);
    setActiveRole(null);
    setMfaPending(false);
    setMfaFactorId(null);
  }, []);

  const value = useMemo(() => ({
    claims, activeRole, setActiveRole, loading, error, signIn, signOut,
    mfaPending, verifyMfaCode, cancelMfaLogin,
    isAuthenticated: !!claims
  }), [claims, activeRole, loading, error, signIn, signOut, mfaPending, verifyMfaCode, cancelMfaLogin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}