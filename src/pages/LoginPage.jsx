import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const claims = await signIn(email, password);
      navigate(`/${claims.primaryRole}/home`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
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
        <h1>Sign in to ExamsLock</h1>
        <p className="login-copy">Accounts are created by your institutional administrator — there is no public sign-up. Enter the email and password you were issued.</p>
        {error && <div className="alert warning"><b>Sign-in error</b><span>{error}</span></div>}
        <form id="login-form" onSubmit={submit}>
          <label>Email
            <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label>Password
            <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          <button className="btn gold full" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="login-note">Supabase Auth · Row-Level-Security enforced · No client secret stored in the app</p>
      </div>
    </div>
  );
}
