import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';
import StatCard from '../../components/StatCard';

export default function FinancialsPage() {
  const { data, loading, error } = useSupabaseQuery(async () => {
    const { data: records, error: err } = await supabase.from('financial_records').select('*').order('created_at', { ascending: false });
    if (err) throw err;
    const total = (records || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
    return {
      rows: (records || []).map(r => ({ id: r.id, type: r.type, amount: `${r.currency} ${Number(r.amount).toLocaleString()}`, status: r.status, reference: r.reference, created: new Date(r.created_at).toLocaleDateString() })),
      total, count: records?.length || 0
    };
  }, []);

  const columns = [{ key: 'type', label: 'Type' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status', render: v => <StatusChip value={v} /> }, { key: 'reference', label: 'Reference' }, { key: 'created', label: 'Date' }];

  return (
    <>
      <div className="page-title"><h2>Financials</h2></div>
      {loading ? <div className="loading">Loading financial records…</div> :
        error ? <div className="alert warning"><b>Could not load financials</b><span>{error}</span></div> : <>
        <div className="status-grid" style={{ marginBottom: 18 }}>
          <StatCard label="Total records" value={data.count} />
          <StatCard label="Combined amount" value={data.total.toLocaleString()} />
        </div>
        <div className="card pad"><DataTable columns={columns} rows={data.rows} emptyLabel="No financial records yet." /></div>
        </>}
    </>
  );
}
