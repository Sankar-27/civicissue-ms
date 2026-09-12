import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Users, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  Search, Filter, Building2, XCircle, Link2
} from 'lucide-react';
import { adminDashboard, adminGetIssues, adminUpdateStatus, adminUpdatePriority, getDepartments, adminAssign } from '../services/api';
import { useToast } from '../components/ToastProvider';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const STATUSES = ['OPEN', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CATEGORIES = ['ROAD', 'WATER', 'ELECTRICITY', 'SANITATION', 'STREETLIGHT', 'DRAINAGE', 'OTHER'];

function CategoryChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <svg width="100%" height="200" viewBox="0 0 700 200" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const barHeight = Math.max((d.count / max) * 140, 4);
        const x = 10 + i * (690 / data.length);
        const width = Math.min(60, 690 / data.length - 20);
        return (
          <g key={d.category}>
            <rect x={x} y={180 - barHeight} width={width} height={barHeight} rx="5"
              fill="url(#catGrad)" />
            <text x={x + width / 2} y={180 - barHeight - 6} textAnchor="middle"
              style={{ fontSize: 12, fontWeight: 700, fill: 'var(--text)' }}>{d.count}</text>
            <text x={x + width / 2} y={196} textAnchor="middle"
              style={{ fontSize: 9, fontWeight: 600, fill: 'var(--text-muted)' }}>
              {d.category.length > 7 ? d.category.slice(0, 6) : d.category}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="catGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TrendChart({ data }) {
  const values = data.map(d => d.count);
  const max = Math.max(...values, 1);
  const W = 700, H = 200, pad = 24;
  const pts = values.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (W - pad * 2);
    const y = H - pad - (v / max) * (H - pad * 2);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const area = `${d} L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity=".35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trendGrad)" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="3" />
            <title>{data[i].date}: {data[i].count}</title>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1, textAlign: 'center', fontWeight: 600 }}>
            {String(d.date).slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const loadDashboard = useCallback(async () => {
    try { setStats(await adminDashboard()); } catch { /* ignore */ }
  }, []);

  const loadDepartments = useCallback(async () => {
    try { setDepartments(await getDepartments()); } catch { setDepartments([]); }
  }, []);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 0, size: 50 };
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterCategory) params.category = filterCategory;
      if (search.trim()) params.search = search.trim();
      const data = await adminGetIssues(params);
      setIssues(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch {
      toast('Failed to load issues', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, filterCategory, search, toast]);

  useEffect(() => { loadDashboard(); loadDepartments(); }, [loadDashboard, loadDepartments]);
  useEffect(() => { loadIssues(); }, [loadIssues]);

  const updateStatus = async (id, status) => {
    try {
      await adminUpdateStatus(id, status);
      toast(`Status updated to ${status}`, 'success');
      loadIssues(); loadDashboard();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const updatePriority = async (id, priority) => {
    try {
      await adminUpdatePriority(id, priority);
      toast(`Priority updated to ${priority}`, 'success');
      loadIssues(); loadDashboard();
    } catch {
      toast('Failed to update priority', 'error');
    }
  };

  const assignDept = async (id, deptId) => {
    if (!deptId) return;
    try {
      await adminAssign(id, Number(deptId), 'Admin assignment');
      toast('Issue assigned to department', 'success');
      loadIssues(); loadDashboard();
    } catch {
      toast('Failed to assign department', 'error');
    }
  };

  const statCards = stats ? [
    { label: 'Total', value: stats.totalIssues, icon: BarChart3, color: 'var(--text)' },
    { label: 'Open', value: stats.openIssues, icon: AlertTriangle, color: 'var(--primary)' },
    { label: 'In Progress', value: stats.inProgressIssues, icon: Clock, color: 'var(--warning)' },
    { label: 'Resolved', value: stats.resolvedIssues, icon: CheckCircle2, color: 'var(--success)' },
    { label: 'Rejected', value: stats.rejectedIssues, icon: XCircle, color: 'var(--danger)' },
    { label: 'Critical', value: stats.criticalIssues, icon: AlertTriangle, color: 'var(--danger)' },
  ] : [];

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Monitor, manage and resolve all civic complaints</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/users" className="btn btn-ghost btn-sm"><Users size={16} /> Users</Link>
          <Link to="/admin/departments" className="btn btn-ghost btn-sm"><Building2 size={16} /> Departments</Link>
        </div>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {statCards.map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
          ))}
        </div>
      )}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Category Breakdown</h3>
            <CategoryChart data={stats.categoryCounts || []} />
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>7-Day Trend</h3>
            <TrendChart data={stats.sevenDayTrend || []} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 40 }} placeholder="Search issues..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadIssues()} />
        </div>
        <select className="form-control" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="form-control" style={{ width: 'auto' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="form-control" style={{ width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={loadIssues}><Filter size={14} /> Filter</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterCategory(''); }}>
          Clear
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>All Issues ({totalElements})</h3>
        <button className="btn btn-ghost btn-sm" onClick={loadIssues}><RefreshCw size={14} /> Refresh</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <span className="spinner" style={{ width: 40, height: 40, borderColor: 'rgba(99,102,241,.3)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No issues found</td></tr>
              ) : issues.map(issue => (
                <tr key={issue.id}>
                  <td>
                    <Link to={`/admin/issues/${issue.id}`} style={{ fontWeight: 700, color: 'var(--primary)' }}>#{issue.id}</Link>
                  </td>
                  <td>
                    <Link to={`/admin/issues/${issue.id}`} style={{ fontWeight: 600 }}>{issue.title}</Link>
                  </td>
                  <td><span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{issue.category}</span></td>
                  <td><StatusBadge status={issue.status} /></td>
                  <td><PriorityBadge priority={issue.priority} /></td>
                  <td className="text-sm text-muted">{issue.departmentName || '—'}</td>
                  <td className="text-sm text-muted">{new Date(issue.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select className="form-control" style={{ padding: '6px 10px', fontSize: '.8rem', width: 'auto' }}
                        value={issue.status}
                        onChange={e => updateStatus(issue.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                      <select className="form-control" style={{ padding: '6px 10px', fontSize: '.8rem', width: 'auto' }}
                        value={issue.priority}
                        onChange={e => updatePriority(issue.id, e.target.value)}>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select className="form-control" style={{ padding: '6px 10px', fontSize: '.8rem', width: 'auto' }}
                        value={issue.departmentId || ''}
                        onChange={e => assignDept(issue.id, e.target.value)}>
                        <option value="" disabled>Assign Dept</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <Link to={`/admin/issues/${issue.id}`} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }} title="View">
                        <Link2 size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
