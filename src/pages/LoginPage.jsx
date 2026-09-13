import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { signIn, verifyMfaCode, cancelMfaLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('password'); // 'password' | 'mfa'
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submitPassword = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await signIn(email, password);
      if (result?.mfaRequired) {
        setStep('mfa');
      } else {
        navigate(`/${result.primaryRole}/home`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitMfaCode = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const claims = await verifyMfaCode(code);
      navigate(`/${claims.primaryRole}/home`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const backToPassword = async () => {
    setBusy(true);
    try { await cancelMfaLogin(); } finally {
      setStep('password'); setCode(''); setError(''); setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand">
          <img src="/icon.svg" alt="ExamsLock" />
          <div>EXAMSLOCK<small>EXAMINATION INTEGRITY PLATFORM</small></div>
        </div>
        <div className="eyebrow">Secure institutional access</div>

        {step === 'password' ? (
          <>
            <h1>Sign in to ExamsLock</h1>
            <p className="login-copy">Accounts are created by your institutional administrator — there is no public sign-up. Enter the email and password you were issued.</p>
            {error && <div className="alert warning"><b>Sign-in error</b><span>{error}</span></div>}
            <form id="login-form" onSubmit={submitPassword}>
              <label>Email
                <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
              </label>
              <label>Password
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(s => !s)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.7 18.7 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.7 18.7 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
              <button className="btn gold full" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            </form>
          </>
        ) : (
          <>
            <h1>Enter your authenticator code</h1>
            <p className="login-copy">Your account has two-factor authentication enabled. Open your authenticator app and enter the 6-digit code to finish signing in.</p>
            {error && <div className="alert warning"><b>Verification failed</b><span>{error}</span></div>}
            <form id="login-form" onSubmit={submitMfaCode}>
              <label>Authenticator code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </label>
              <button className="btn gold full" type="submit" disabled={busy || code.length !== 6}>{busy ? 'Verifying…' : 'Verify & sign in'}</button>
              <button className="btn ghost full" type="button" onClick={backToPassword} disabled={busy}>Use a different account</button>
            </form>
          </>
        )}

        <p className="login-note">Supabase Auth · Row-Level-Security enforced · No client secret stored in the app</p>
      </div>
    </div>
  );
}