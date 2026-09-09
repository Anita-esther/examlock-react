import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';
import StatCard from '../../components/StatCard';

export default function BookletsPage() {
  const { claims } = useAuth();
  const { data, loading, error } = useSupabaseQuery(async () => {
    const { data: booklets, error: err } = await supabase.from('booklets').select('*').eq('tenant_id', claims.tenantId).order('created_at', { ascending: false });
    if (err) throw err;
    const counts = (booklets || []).reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});
    return { rows: (booklets || []).map(b => ({ id: b.id, serial: b.serial_no, status: b.status, created: new Date(b.created_at).toLocaleDateString() })), counts };
  }, [claims.tenantId]);

  const columns = [{ key: 'serial', label: 'Serial No.' }, { key: 'status', label: 'Status', render: v => <StatusChip value={v} /> }, { key: 'created', label: 'Printed' }];

  return (
    <>
      <div className="page-title"><h2>Booklets</h2></div>
      {loading ? <div className="loading">Loading booklet inventory…</div> :
        error ? <div className="alert warning"><b>Could not load booklets</b><span>{error}</span></div> : <>
        <div className="status-grid" style={{ marginBottom: 18 }}>
          <StatCard label="Printed" value={data.counts.PRINTED || 0} />
          <StatCard label="Dispatched" value={data.counts.DISPATCHED || 0} />
          <StatCard label="Issued" value={data.counts.ISSUED || 0} />
        </div>
        <div className="card pad"><DataTable columns={columns} rows={data.rows} emptyLabel="No booklets printed yet." /></div>
        </>}
    </>
  );
}
