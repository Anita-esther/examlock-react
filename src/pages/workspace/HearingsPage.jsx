import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';

export default function HearingsPage() {
  const { claims } = useAuth();
  const { data: rows, loading, error } = useSupabaseQuery(async () => {
    const { data: cases } = await supabase.from('malpractice_cases').select('id').eq('tenant_id', claims.tenantId);
    const caseIds = (cases || []).map(c => c.id);
    if (!caseIds.length) return [];
    const { data, error: err } = await supabase.from('hearings')
      .select('id, scheduled_at, decision, notes, malpractice_cases(description)')
      .in('case_id', caseIds).order('scheduled_at', { ascending: true });
    if (err) throw err;
    return (data || []).map(h => ({ id: h.id, case: h.malpractice_cases?.description, scheduled: h.scheduled_at ? new Date(h.scheduled_at).toLocaleString() : 'Not scheduled', decision: h.decision || 'Pending', notes: h.notes }));
  }, [claims.tenantId]);

  const columns = [
    { key: 'case', label: 'Case' }, { key: 'scheduled', label: 'Scheduled' },
    { key: 'decision', label: 'Decision', render: v => <StatusChip value={v} /> }, { key: 'notes', label: 'Notes' }
  ];

  return (
    <>
      <div className="page-title"><h2>Hearings</h2></div>
      {loading ? <div className="loading">Loading hearings…</div> :
        error ? <div className="alert warning"><b>Could not load hearings</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No hearings scheduled." /></div>}
    </>
  );
}
