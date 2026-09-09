import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';

export default function IntegrityPage() {
  const { claims } = useAuth();
  const { data: rows, loading, error } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.from('integrity_alerts').select('*').eq('tenant_id', claims.tenantId).order('created_at', { ascending: false });
    if (err) throw err;
    return (data || []).map(a => ({ id: a.id, title: a.title, detail: a.detail, level: a.level, status: a.status, created: new Date(a.created_at).toLocaleString() }));
  }, [claims.tenantId]);

  const columns = [
    { key: 'title', label: 'Alert' }, { key: 'detail', label: 'Detail' },
    { key: 'level', label: 'Level', render: v => <StatusChip value={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusChip value={v} /> }, { key: 'created', label: 'Raised' }
  ];

  return (
    <>
      <div className="page-title"><h2>Integrity</h2></div>
      {loading ? <div className="loading">Loading alerts…</div> :
        error ? <div className="alert warning"><b>Could not load alerts</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No integrity alerts raised." /></div>}
    </>
  );
}
