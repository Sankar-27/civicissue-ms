export default function StatCard({ label, value, icon: Icon, color = 'var(--primary)' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '20' }}>
        <Icon size={20} color={color} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}
