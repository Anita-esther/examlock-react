import { useCallback, useState } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';

export default function SecurityPage() {
  const [enrolling, setEnrolling] = useState(null); // { factorId, qrCode, secret } | null
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const { data: factors, loading, error, refetch } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.auth.mfa.listFactors();
    if (err) throw err;
    return data?.totp ?? [];
  }, []);

  const startEnroll = useCallback(async () => {
    setActionError(''); setNotice(''); setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' });
      if (err) throw err;
      setEnrolling({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }, []);

  const confirmEnroll = useCallback(async (e) => {
    e.preventDefault();
    setActionError(''); setBusy(true);
    try {
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrolling.factorId, code });
      if (err) throw err;
      setEnrolling(null);
      setCode('');
      setNotice('Two-factor authentication is now enabled on your account.');
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }, [enrolling, code, refetch]);

  const cancelEnroll = useCallback(async () => {
    if (enrolling) {
      // Best-effort cleanup of the unverified factor so it doesn't linger.
      await supabase.auth.mfa.unenroll({ factorId: enrolling.factorId }).catch(() => {});
    }
    setEnrolling(null); setCode(''); setActionError('');
  }, [enrolling]);

  const removeFactor = useCallback(async (factorId) => {
    setActionError(''); setNotice(''); setBusy(true);
    try {
      const { error: err } = await supabase.auth.mfa.unenroll({ factorId });
      if (err) throw err;
      setNotice('Authenticator app removed from your account.');
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }, [refetch]);

  return (
    <>
      <div className="page-title"><h2>Security</h2></div>

      {loading ? <div className="loading">Loading your security settings…</div> :
        error ? <div className="alert warning"><b>Could not load security settings</b><span>{error}</span></div> :
        <div className="card pad">
          <h3>Two-factor authentication</h3>
          <p>Add an authenticator app (like Google Authenticator or Authy) as a second sign-in step. Once enabled, you'll be asked for a 6-digit code every time you sign in.</p>

          {notice && <div className="alert"><b>{notice}</b></div>}
          {actionError && <div className="alert warning"><b>{actionError}</b></div>}

          {factors && factors.length > 0 && (
            <ul className="role-permission-list">
              {factors.map(f => (
                <li key={f.id} className="role-permission-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>{f.friendly_name || 'Authenticator app'}</strong>
                    <p>Enrolled {new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                  <button className="btn ghost sm" type="button" disabled={busy} onClick={() => removeFactor(f.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}

          {!enrolling && (!factors || factors.length === 0) && (
            <button className="btn gold" type="button" disabled={busy} onClick={startEnroll}>Set up authenticator app</button>
          )}

          {enrolling && (
            <form onSubmit={confirmEnroll} style={{ marginTop: 16 }}>
              <p>Scan this QR code with your authenticator app, then enter the 6-digit code it generates.</p>
              <div
                style={{ width: 200, height: 200, background: '#fff', borderRadius: 12, padding: 10, marginBottom: 12 }}
                dangerouslySetInnerHTML={{ __html: enrolling.qrCode }}
              />
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Can't scan? Enter this code manually: <code>{enrolling.secret}</code></p>
              <label>Authenticator code
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn gold" type="submit" disabled={busy || code.length !== 6}>{busy ? 'Verifying…' : 'Verify & enable'}</button>
                <button className="btn ghost" type="button" disabled={busy} onClick={cancelEnroll}>Cancel</button>
              </div>
            </form>
          )}
        </div>}
    </>
  );
}