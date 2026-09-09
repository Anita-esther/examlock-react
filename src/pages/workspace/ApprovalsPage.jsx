import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';

export default function ApprovalsPage() {
  const { claims } = useAuth();
  const { data: rows, loading, error, refetch } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.from('venue_change_requests')
      .select('id, reason, central_status, venues(name), exam_slots(courses(code))')
      .order('created_at', { ascending: false });
    if (err) throw err;
    return (data || []).map(v => ({ id: v.id, course: v.exam_slots?.courses?.code, requestedVenue: v.venues?.name, reason: v.reason, status: v.central_status }));
  }, [claims.tenantId]);

  const decide = async (id, decision) => {
    const { error: err } = await supabase.from('venue_change_requests').update({ central_status: decision, decided_at: new Date().toISOString() }).eq('id', id);
    if (!err) refetch();
  };

  const columns = [
    { key: 'course', label: 'Course' }, { key: 'requestedVenue', label: 'Requested Venue' }, { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: v => <StatusChip value={v} /> },
    { key: 'action', label: '', render: (_, r) => r.status === 'PENDING_APPROVAL' ? (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn gold" onClick={() => decide(r.id, 'APPROVED')}>Approve</button>
        <button className="btn ghost" onClick={() => decide(r.id, 'REJECTED')}>Reject</button>
      </div>
    ) : null }
  ];

  return (
    <>
      <div className="page-title"><h2>Approvals</h2></div>
      {loading ? <div className="loading">Loading approvals…</div> :
        error ? <div className="alert warning"><b>Could not load approvals</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No pending approvals." /></div>}
    </>
  );
}
