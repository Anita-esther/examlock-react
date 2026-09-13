import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import { roleLabel } from '../../lib/domain';
import { loadRoleOverview } from '../../lib/homeOverview';
import StatCard from '../../components/StatCard';

export default function HomePage() {
  const { claims, activeRole } = useAuth();

  const { data, loading, error } = useSupabaseQuery(async () => {
    const [{ data: profile }, overview] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', claims.sub).single(),
      loadRoleOverview(activeRole, claims)
    ]);
    return { profile, overview };
  }, [claims.sub, activeRole]);

  if (loading) return <div className="loading">Loading your workspace…</div>;

  const profile = data?.profile;
  const overview = data?.overview ?? { title: 'Overview', stats: [] };

  return (
    <>
      <div className="hero">
        <div className="card pad profile">
          <div className="portrait">{(claims.name || '?').slice(0,1).toUpperCase()}</div>
          <div>
            <h2>{claims.name}</h2>
            <p>{profile?.department || '—'} {profile?.faculty ? `· ${profile.faculty}` : ''}</p>
            <p>{claims.email}</p>
            <span className="role-pill">{roleLabel(activeRole)}</span>
          </div>
        </div>
        <div className="card pad">
          <div className="eyebrow">{overview.title}</div>
          {error ? (
            <p className="muted" style={{ marginTop: 8 }}>Could not load your overview: {error}</p>
          ) : overview.stats.length > 0 ? (
            <div className="status-grid" style={{ marginTop: 12 }}>
              {overview.stats.map(s => <StatCard key={s.label} label={s.label} value={s.value} />)}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 8 }}>No overview metrics configured for this role yet.</p>
          )}
        </div>
      </div>
      <div className="card pad">
        <div className="eyebrow">Session</div>
        <p className="muted" style={{ marginTop: 8 }}>
          Signed in as <b>{claims.email}</b>. Every number above comes straight from Postgres — Row Level Security
          scopes what you can see to your role (and, where applicable, your tenant or department) automatically.
        </p>
      </div>
    </>
  );
}