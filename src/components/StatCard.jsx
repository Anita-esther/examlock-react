export default function StatCard({ label, value }) {
  return (
    <div className="metric">
      <strong>{value ?? '—'}</strong>
      <span>{label}</span>
    </div>
  );
}
