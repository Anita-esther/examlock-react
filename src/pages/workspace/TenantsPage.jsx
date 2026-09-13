import { useState } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable from '../../components/DataTable';

export default function TenantsPage() {
  const { data: rows, loading, error, refetch } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    if (err) throw err;
    return (data || []).map(t => ({ id: t.id, name: t.name, code: t.code, session: t.session, created: new Date(t.created_at).toLocaleDateString() }));
  }, []);

  const [form, setForm] = useState({ name: '', code: '', session: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Protected by the tenants_write RLS policy (is_superadmin()), so this can go straight through
  // the client — no service-role Edge Function is needed the way user creation needs one.
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMessage(null);
    try {
      const { error: err } = await supabase.from('tenants').insert({ name: form.name, code: form.code, session: form.session || null });
      if (err) throw err;
      setMessage({ type: 'success', text: `${form.name} onboarded. You can now create its institutional admin from the Admins page.` });
      setForm({ name: '', code: '', session: '' });
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const columns = [{ key: 'name', label: 'Institution' }, { key: 'code', label: 'Code' }, { key: 'session', label: 'Session' }, { key: 'created', label: 'Onboarded' }];

  return (
    <>
      <div className="page-title"><h2>Tenants</h2></div>
      <form className="create-user-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Institution name<input required value={form.name} onChange={update('name')} /></label>
          <label>Code<input required value={form.code} onChange={update('code')} /></label>
          <label>Session<input placeholder="e.g. 2025/2026" value={form.session} onChange={update('session')} /></label>
        </div>
        <button className="btn gold" type="submit" disabled={busy}>{busy ? 'Onboarding…' : 'Onboard institution'}</button>
        {message && <div className={`alert ${message.type === 'error' ? 'warning' : ''}`} style={{ marginTop: 12 }}><span>{message.text}</span></div>}
      </form>
      {loading ? <div className="loading">Loading tenants…</div> :
        error ? <div className="alert warning"><b>Could not load tenants</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No tenants onboarded yet." /></div>}
    </>
  );
}