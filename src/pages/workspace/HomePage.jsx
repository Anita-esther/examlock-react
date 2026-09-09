import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import { roleLabel } from '../../lib/domain';
import StatCard from '../../components/StatCard';

export default function HomePage() {
  const { claims, activeRole } = useAuth();

  const { data, loading } = useSupabaseQuery(async () => {
    const uid = claims.sub;
    const tenantId = claims.tenantId || null;
    const [{ data: profile }, { count: courseCount }, { count: venueCount }, { count: userCount }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('venues').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    ]);
    return { profile, courseCount: courseCount ?? 0, venueCount: venueCount ?? 0, userCount: userCount ?? 0 };
  }, [claims.sub, activeRole]);

  if (loading) return <div className="loading">Loading your workspace…</div>;

  const profile = data?.profile;
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
          <div className="eyebrow">Tenant overview</div>
          <div className="status-grid" style={{ marginTop: 12 }}>
            <StatCard label="Courses" value={data?.courseCount} />
            <StatCard label="Venues" value={data?.venueCount} />
            <StatCard label="Users" value={data?.userCount} />
          </div>
        </div>
      </div>
      <div className="card pad">
        <div className="eyebrow">Session</div>
        <p className="muted" style={{ marginTop: 8 }}>
          Signed in as <b>{claims.email}</b>. Every number above comes straight from Postgres — Row Level Security
          scopes what you can see to your tenant and role automatically.
        </p>
      </div>
    </>
  );
}
