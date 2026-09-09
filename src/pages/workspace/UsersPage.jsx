import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import { adminCreateUser } from '../../lib/adminApi';
import DataTable, { StatusChip } from '../../components/DataTable';

const ROLE_OPTIONS = ['student','lecturer','invigilator','hod','qa','printer','central','committee','institutional','superadmin','financials-admin'];

export default function UsersPage() {
  const { claims } = useAuth();
  const { data: rows, loading, error, refetch } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase.from('profiles').select('id, name, primary_role, department, active').eq('tenant_id', claims.tenantId);
    if (err) throw err;
    return (data || []).map(u => ({ ...u, status: u.active ? 'Active' : 'Disabled' }));
  }, [claims.tenantId]);

  const [form, setForm] = useState({ name: '', email: '', role: 'student', staff_id: '', department: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMessage(null);
    try {
      const result = await adminCreateUser(form);
      setMessage({ type: 'success', text: `User created. Temporary password: ${result.temporary_password}` });
      setForm({ name: '', email: '', role: 'student', staff_id: '', department: '' });
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'name', label: 'User' }, { key: 'primary_role', label: 'Role' }, { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status', render: v => <StatusChip value={v} /> }
  ];

  return (
    <>
      <div className="page-title"><h2>Users</h2></div>
      <form className="create-user-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Full name<input required value={form.name} onChange={update('name')} /></label>
          <label>Email<input type="email" required value={form.email} onChange={update('email')} /></label>
          <label>Role
            <select value={form.role} onChange={update('role')}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label>Staff / Matric ID<input value={form.staff_id} onChange={update('staff_id')} /></label>
          <label>Department<input value={form.department} onChange={update('department')} /></label>
        </div>
        <button className="btn gold" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create user'}</button>
        {message && <div className={`alert ${message.type === 'error' ? 'warning' : ''}`} style={{ marginTop: 12 }}>
          <span>{message.text}</span>
        </div>}
        <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Provisioned via Supabase Auth by the admin-create-user Edge Function — no public sign-up exists.
          Share the temporary password with the user out of band.
        </p>
      </form>
      {loading ? <div className="loading">Loading users…</div> :
        error ? <div className="alert warning"><b>Could not load users</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No users provisioned yet." /></div>}
    </>
  );
}
