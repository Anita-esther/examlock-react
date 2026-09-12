import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import { roleLabel } from '../../lib/domain';

export default function MyRolePage() {
  const { activeRole } = useAuth();

  const { data: permissions, loading, error } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase
      .from('role_permissions')
      .select('permissions(key, label, description)')
      .eq('role', activeRole);
    if (err) throw err;
    return (data || []).map(row => row.permissions).filter(Boolean);
  }, [activeRole]);

  return (
    <>
      <div className="page-title"><h2>My Role · {roleLabel(activeRole)}</h2></div>

      {loading ? <div className="loading">Loading your responsibilities…</div> :
        error ? <div className="alert warning"><b>Could not load your role permissions</b><span>{error}</span></div> :
        <div className="card pad">
          {permissions && permissions.length > 0 ? (
            <ul className="role-permission-list">
              {permissions.map(perm => (
                <li key={perm.key} className="role-permission-item">
                  <strong>{perm.label}</strong>
                  {perm.description && <p>{perm.description}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No permissions have been configured for this role yet. Contact your administrator if you believe this is a mistake.</p>
          )}
        </div>}
    </>
  );
}