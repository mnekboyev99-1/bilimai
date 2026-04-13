export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="stat-card">
      <div className="muted">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="muted" style={{ fontSize: 13 }}>{hint}</div> : null}
    </div>
  );
}
