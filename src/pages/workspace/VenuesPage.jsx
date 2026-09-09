import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';

export default function VenuesPage() {
  const { claims } = useAuth();
  const { data: rows, loading, error } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.from('venues').select('*').eq('tenant_id', claims.tenantId);
    if (err) throw err;
    return (data || []).map(v => ({ id: v.id, name: v.name, department: v.department, faculty: v.faculty, capacity: v.capacity, status: v.status, approved: v.approved ? 'Approved' : 'Pending review' }));
  }, [claims.tenantId]);

  const columns = [
    { key: 'name', label: 'Venue' }, { key: 'department', label: 'Department' }, { key: 'faculty', label: 'Faculty' },
    { key: 'capacity', label: 'Capacity' }, { key: 'approved', label: 'Geotag', render: v => <StatusChip value={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusChip value={v} /> }
  ];

  return (
    <>
      <div className="page-title"><h2>Venues</h2></div>
      {loading ? <div className="loading">Loading venues…</div> :
        error ? <div className="alert warning"><b>Could not load venues</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No venues registered yet." /></div>}
    </>
  );
}
