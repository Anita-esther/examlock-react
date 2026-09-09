import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';

export default function CasesPage() {
  const { claims } = useAuth();
  const { data: rows, loading, error } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.from('malpractice_cases')
      .select('id, description, status, created_at, profiles(name, matric_no)')
      .eq('tenant_id', claims.tenantId).order('created_at', { ascending: false });
    if (err) throw err;
    return (data || []).map(c => ({ id: c.id, student: c.profiles?.name, matric: c.profiles?.matric_no, description: c.description, status: c.status, filed: new Date(c.created_at).toLocaleDateString() }));
  }, [claims.tenantId]);

  const columns = [
    { key: 'student', label: 'Student' }, { key: 'matric', label: 'Matric No.' }, { key: 'description', label: 'Allegation' },
    { key: 'status', label: 'Status', render: v => <StatusChip value={v} /> }, { key: 'filed', label: 'Filed' }
  ];

  return (
    <>
      <div className="page-title"><h2>Cases</h2></div>
      {loading ? <div className="loading">Loading cases…</div> :
        error ? <div className="alert warning"><b>Could not load cases</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No malpractice cases on file." /></div>}
    </>
  );
}
