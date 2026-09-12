import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { getMyIssues } from '../services/api';
import { useToast } from '../components/ToastProvider';
import StatCard from '../components/StatCard';
import IssueCard from '../components/IssueCard';

const FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export default function CitizenDashboard() {
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setIssues(await getMyIssues());
    } catch {
      toast('Failed to load issues', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'ALL' ? issues : issues.filter(i => i.status === filter);

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'OPEN' || i.status === 'UNDER_REVIEW' || i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS').length,
    resolved: issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length,
    rejected: issues.filter(i => i.status === 'REJECTED').length,
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">Track and manage all your reported civic issues</p>
        </div>
        <Link to="/issues/new" className="btn btn-primary">
          <Plus size={18} /> Report Issue
        </Link>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard label="Total Filed" value={stats.total} icon={FileText} color="var(--primary)" />
        <StatCard label="Open" value={stats.open} icon={AlertCircle} color="var(--primary)" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="var(--success)" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="var(--danger)" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={load}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <span className="spinner" style={{ width: 40, height: 40, borderColor: 'rgba(99,102,241,.3)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>No issues found</h3>
          <p>{filter === 'ALL' ? "You haven't reported any issues yet." : `No ${filter.replace('_', ' ').toLowerCase()} issues.`}</p>
          {filter === 'ALL' && (
            <Link to="/issues/new" className="btn btn-primary"><Plus size={18} /> Report your first issue</Link>
          )}
        </div>
      ) : (
        <div className="issues-grid">
          {filtered.map(issue => <IssueCard key={issue.id} issue={issue} />)}
        </div>
      )}
    </div>
  );
}
