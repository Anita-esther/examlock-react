import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';

export default function ExamsPage() {
  const { claims } = useAuth();
  const { data: rows, loading, error } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.from('exam_slots')
      .select('id, scheduled_at, duration_min, status, hod_activated, courses(code, title), venues(name)')
      .eq('tenant_id', claims.tenantId)
      .order('scheduled_at', { ascending: true });
    if (err) throw err;
    return (data || []).map(s => ({
      id: s.id, code: s.courses?.code, title: s.courses?.title, venue: s.venues?.name || 'Unassigned',
      scheduled: s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : 'Not scheduled',
      duration: `${s.duration_min || 0} min`, status: s.status, activated: s.hod_activated ? 'Activated' : 'Awaiting HOD'
    }));
  }, [claims.tenantId]);

  const columns = [
    { key: 'code', label: 'Course' }, { key: 'title', label: 'Title' }, { key: 'scheduled', label: 'Scheduled' },
    { key: 'duration', label: 'Duration' }, { key: 'venue', label: 'Venue' },
    { key: 'status', label: 'Status', render: v => <StatusChip value={v} /> },
    { key: 'activated', label: 'Activation', render: v => <StatusChip value={v} /> }
  ];

  return (
    <>
      <div className="page-title"><h2>Exams</h2></div>
      {loading ? <div className="loading">Loading exams…</div> :
        error ? <div className="alert warning"><b>Could not load exams</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No exams scheduled yet." /></div>}
    </>
  );
}
