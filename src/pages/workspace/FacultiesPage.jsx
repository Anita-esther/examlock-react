import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import { StatusChip } from '../../components/DataTable';

export default function FacultiesPage() {
  const { claims } = useAuth();

  const { data: rows, loading, error, refetch } = useSupabaseQuery(async () => {
    const { data, error: err } = await supabase
      .from('faculties')
      .select('id, name, active, created_at, updated_at')
      .eq('tenant_id', claims.tenantId)
      .is('deleted_at', null)
      .order('name');
    if (err) throw err;
    return (data || []).map(f => ({ ...f, status: f.active ? 'Active' : 'Disabled' }));
  }, [claims.tenantId]);

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setMessage(null);
    try {
      const { error: err } = await supabase.from('faculties').insert({ tenant_id: claims.tenantId, name });
      if (err) throw err;
      setName('');
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  // "Get a single faculty" — this uses the row already loaded in the list rather than a
  // separate fetch-by-id call, matching how every other page in this app edits inline.
  const startEdit = (row) => { setEditingId(row.id); setEditingName(row.name); setMessage(null); };
  const cancelEdit = () => { setEditingId(null); setEditingName(''); };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusyId(editingId); setMessage(null);
    try {
      const { error: err } = await supabase
        .from('faculties')
        .update({ name: editingName, updated_at: new Date().toISOString() })
        .eq('id', editingId);
      if (err) throw err;
      cancelEdit();
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (row) => {
    setBusyId(row.id); setMessage(null);
    try {
      const { error: err } = await supabase
        .from('faculties')
        .update({ active: !row.active, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (err) throw err;
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const softDelete = async (row) => {
    if (!window.confirm(`Remove "${row.name}"? This can be restored later from the database if needed, but will disappear from this list immediately.`)) return;
    setBusyId(row.id); setMessage(null);
    try {
      const { error: err } = await supabase
        .from('faculties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', row.id);
      if (err) throw err;
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="page-title"><h2>Faculties</h2></div>

      <form className="create-user-form" onSubmit={create}>
        <div className="form-grid">
          <label>Faculty name<input required value={name} onChange={e => setName(e.target.value)} /></label>
        </div>
        <button className="btn gold" type="submit" disabled={busy || !name.trim()}>{busy ? 'Adding…' : 'Add faculty'}</button>
        {message && <div className="alert warning" style={{ marginTop: 12 }}><span>{message.text}</span></div>}
      </form>

      {loading ? <div className="loading">Loading faculties…</div> :
        error ? <div className="alert warning"><b>Could not load faculties</b><span>{error}</span></div> :
        <div className="card pad">
          {rows && rows.length > 0 ? (
            <ul className="role-permission-list">
              {rows.map(f => (
                <li key={f.id} className="role-permission-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  {editingId === f.id ? (
                    <form onSubmit={saveEdit} style={{ display: 'flex', gap: 8, flex: 1, alignItems: 'center' }}>
                      <input required value={editingName} onChange={e => setEditingName(e.target.value)} style={{ flex: 1 }} />
                      <button className="btn gold sm" type="submit" disabled={busyId === f.id}>Save</button>
                      <button className="btn ghost sm" type="button" onClick={cancelEdit}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <strong>{f.name}</strong>
                        <StatusChip value={f.status} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn ghost sm" type="button" disabled={busyId === f.id} onClick={() => startEdit(f)}>Edit</button>
                        <button className="btn ghost sm" type="button" disabled={busyId === f.id} onClick={() => toggleActive(f)}>
                          {f.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn ghost sm" type="button" disabled={busyId === f.id} onClick={() => softDelete(f)}>Remove</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No faculties yet. Add one above to get started.</p>
          )}
        </div>}
    </>
  );
}