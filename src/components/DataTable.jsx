import { statusTone } from '../lib/domain';

export function StatusChip({ value }) {
  if (!value) return null;
  return <span className={`chip ${statusTone(String(value))}`}>{value}</span>;
}

export default function DataTable({ columns, rows, emptyLabel = 'No records yet.' }) {
  if (!rows?.length) return <div className="empty-state">{emptyLabel}</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map(c => (
                <td key={c.key}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
