import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable from '../../components/DataTable';

export default function TenantsPage() {
  const { data: rows, loading, error } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    if (err) throw err;
    return (data || []).map(t => ({ id: t.id, name: t.name, code: t.code, session: t.session, created: new Date(t.created_at).toLocaleDateString() }));
  }, []);

  const columns = [{ key: 'name', label: 'Institution' }, { key: 'code', label: 'Code' }, { key: 'session', label: 'Session' }, { key: 'created', label: 'Onboarded' }];

  return (
    <>
      <div className="page-title"><h2>Tenants</h2></div>
      {loading ? <div className="loading">Loading tenants…</div> :
        error ? <div className="alert warning"><b>Could not load tenants</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No tenants onboarded yet." /></div>}
    </>
  );
}
