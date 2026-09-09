import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable from '../../components/DataTable';

export default function ReportsPage() {
  const { claims } = useAuth();
  const { data: rows, loading, error } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.from('audit_log')
      .select('created_at, action, entity, entity_id')
      .eq('tenant_id', claims.tenantId).order('created_at', { ascending: false }).limit(50);
    if (err) throw err;
    return (data || []).map((e, i) => ({ id: i, time: new Date(e.created_at).toLocaleString(), action: e.action, entity: `${e.entity}${e.entity_id ? ' · ' + e.entity_id : ''}` }));
  }, [claims.tenantId]);

  const columns = [{ key: 'time', label: 'Time' }, { key: 'action', label: 'Action' }, { key: 'entity', label: 'Entity' }];

  return (
    <>
      <div className="page-title"><h2>Reports · Audit Trail</h2></div>
      {loading ? <div className="loading">Loading audit trail…</div> :
        error ? <div className="alert warning"><b>Could not load audit trail</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No audited events yet." /></div>}
    </>
  );
}
