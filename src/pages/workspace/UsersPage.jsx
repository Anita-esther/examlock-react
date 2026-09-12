import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import { adminCreateUser, adminSetUserStatus, adminResetPassword } from '../../lib/adminApi';
import DataTable, { StatusChip } from '../../components/DataTable';

// Superadmin's job is onboarding paying tenants — it only ever creates the one institutional
// admin account per school. It should never see or create staff/student roles.
const SUPERADMIN_ROLE_OPTIONS = ['institutional'];
// Institutional admins manage their own school's staff and students, but must never be able to
// create another institutional admin, a superadmin, or a financials-admin account from this form.
const INSTITUTIONAL_ROLE_OPTIONS = ['student','lecturer','invigilator','hod','qa','printer','central','committee'];

export default function UsersPage() {
  const { claims, activeRole } = useAuth();
  const isSuperadminView = activeRole === 'superadmin';
  const ROLE_OPTIONS = isSuperadminView ? SUPERADMIN_ROLE_OPTIONS : INSTITUTIONAL_ROLE_OPTIONS;

  const { data: rows, loading, error, refetch } = useSupabaseQuery(async () => {
    let query = supabase.from('profiles').select('id, name, primary_role, department, active');
    // Observation 2/3: superadmin's job is onboarding institutional admins, not managing any one
    // school's staff/students — so this view lists institutional-admin accounts platform-wide
    // instead of being scoped to superadmin's own (nonexistent) tenant. Institutional admins keep
    // the original tenant-scoped view of their own school's users.
    query = isSuperadminView
      ? query.eq('primary_role', 'institutional')
      : query.eq('tenant_id', claims.tenantId);
    const { data, error: err } = await query;
    if (err) throw err;
    return (data || []).map(u => ({ ...u, status: u.active ? 'Active' : 'Disabled' }));
  }, [claims.tenantId, isSuperadminView]);

  const [form, setForm] = useState({ name: '', email: '', role: ROLE_OPTIONS[0], staff_id: '', department: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [resetBusyId, setResetBusyId] = useState(null);

  // Keep the form's role in sync if the active workspace changes (e.g. switching between the
  // institutional and superadmin roles) without unmounting this page.
  useEffect(() => {
    setForm(f => (ROLE_OPTIONS.includes(f.role) ? f : { ...f, role: ROLE_OPTIONS[0] }));
  }, [isSuperadminView]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMessage(null);
    try {
      const result = await adminCreateUser(form);
      setMessage({ type: 'success', text: `User created. Temporary password: ${result.temporary_password}` });
      setForm({ name: '', email: '', role: ROLE_OPTIONS[0], staff_id: '', department: '' });
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  // Observation 1 fix: new accounts now start active, so this is the action that lets an admin
  // deactivate (or reactivate) a user, instead of the only path being a manual database write.
  const toggleStatus = async (row) => {
    setStatusBusyId(row.id); setMessage(null);
    try {
      await adminSetUserStatus(row.id, row.status !== 'Active');
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setStatusBusyId(null);
    }
  };

  // Issues a new temporary password via the admin-reset-password Edge Function. The password
  // is shown once in the message banner (same pattern as user creation) — there's no email
  // flow in this app, so the admin has to relay it to the user out of band.
  const resetPassword = async (row) => {
    setResetBusyId(row.id); setMessage(null);
    try {
      const result = await adminResetPassword(row.id);
      setMessage({ type: 'success', text: `Password reset for ${row.name}. New temporary password: ${result.temporary_password}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setResetBusyId(null);
    }
  };

  const columns = [
    { key: 'name', label: 'User' }, { key: 'primary_role', label: 'Role' }, { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status', render: v => <StatusChip value={v} /> },
    { key: 'actions', label: '', render: (_v, row) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn ghost sm"
          type="button"
          disabled={statusBusyId === row.id}
          onClick={() => toggleStatus(row)}
        >
          {statusBusyId === row.id ? 'Updating…' : row.status === 'Active' ? 'Deactivate' : 'Activate'}
        </button>
        <button
          className="btn ghost sm"
          type="button"
          disabled={resetBusyId === row.id}
          onClick={() => resetPassword(row)}
        >
          {resetBusyId === row.id ? 'Resetting…' : 'Reset password'}
        </button>
      </div>
    ) }
  ];

  return (
    <>
      <div className="page-title"><h2>{isSuperadminView ? 'Admins' : 'Users'}</h2></div>
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
      {loading ? <div className="loading">Loading {isSuperadminView ? 'admins' : 'users'}…</div> :
        error ? <div className="alert warning"><b>Could not load {isSuperadminView ? 'admins' : 'users'}</b><span>{error}</span></div> :
        <div className="card pad">
          <DataTable columns={columns} rows={rows} emptyLabel={isSuperadminView ? 'No institutional admins onboarded yet.' : 'No users provisioned yet.'} />
        </div>}
    </>
  );
}