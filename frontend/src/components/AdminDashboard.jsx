import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  Search, Filter, ChevronDown, MapPin, XCircle, Copy
} from 'lucide-react';
import {
  adminGetDashboard, adminGetIssues,
  adminUpdateStatus, adminUpdatePriority, getImageUrl
} from '../api';
import { useToast } from './ToastProvider';
import UserManagement from './UserManagement';

const STATUSES   = ['OPEN','IN_PROGRESS','RESOLVED','REJECTED'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];
const CATEGORIES = ['ROAD','WATER','ELECTRICITY','SANITATION','STREETLIGHT','DRAINAGE','OTHER'];

const STATUS_CLS = { OPEN:'badge-open', IN_PROGRESS:'badge-in_progress', RESOLVED:'badge-resolved', REJECTED:'badge-rejected' };
const PRIO_CLS   = { LOW:'badge-low', MEDIUM:'badge-medium', HIGH:'badge-high', CRITICAL:'badge-critical' };

// ─── Inline bar chart ────────────────────────────────────────
function MiniBarChart({ data, color = 'var(--primary)' }) {
  const max = Math.max(...Object.values(data), 1);
  const entries = Object.entries(data);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:70, padding:'10px 0' }}>
      {entries.map(([label, val]) => (
        <div key={label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700 }}>{val > 0 ? val : ''}</span>
          <div style={{
            width:'100%', borderRadius:'4px 4px 0 0',
            height: `${Math.max((val / max) * 50, val > 0 ? 6 : 0)}px`,
            background: val > 0 ? `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)` : 'var(--border)',
            transition: 'height .6s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: val > 0 ? `0 4px 12px ${color}40` : 'none'
          }} />
          <span style={{ fontSize:9, color:'var(--text-muted)', textAlign:'center', lineHeight:1.2,
            writingMode:'vertical-rl', textOrientation:'mixed', transform:'rotate(180deg)', maxHeight:40, overflow:'hidden', fontWeight:600 }}>
            {label.length > 5 ? label.slice(0,4) : label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Trend line chart ─────────────────────────────────────────
function TrendLine({ data }) {
  const values  = Object.values(data);
  const labels  = Object.keys(data);
  const max     = Math.max(...values, 1);
  const W = 360, H = 70, pad = 12;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * (W - pad * 2);
    const y = pad + (1 - v / max) * (H - pad * 2);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const area = `${d} L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`;

  return (
    <div style={{ overflowX:'auto', padding:'10px 0' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity=".4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d={area} fill="url(#trendGrad)" />
        <path d={d} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill="var(--primary)" stroke="var(--surface)" strokeWidth="3" />
            <title>{labels[i]}: {values[i]}</title>
          </g>
        ))}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        {labels.map((l, i) => (
          <span key={i} style={{ fontSize:9, color:'var(--text-muted)', flex:1, textAlign:'center', fontWeight:600 }}>
            {l.slice(5)} {/* show MM-DD */}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const toast   = useToast();
  const [view, setView] = useState('issues'); // 'issues' | 'users'
  const [stats, setStats]   = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selected, setSelected] = useState(null);

  const loadDashboard = useCallback(async () => {
    try { const r = await adminGetDashboard(); setStats(r.data); } catch {}
  }, []);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus)   params.status   = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterCategory) params.category = filterCategory;
      if (search.trim())  params.search   = search.trim();
      const r = await adminGetIssues(params);
      setIssues(r.data);
    } catch { toast('Failed to load issues', 'error'); }
    finally { setLoading(false); }
  }, [filterStatus, filterPriority, filterCategory, search]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (view === 'issues') loadIssues(); }, [view, loadIssues]);

  const updateStatus = async (id, status) => {
    try {
      await adminUpdateStatus(id, status);
      toast(`Status updated to ${status}`, 'success');
      loadIssues(); loadDashboard();
      setSelected(p => p ? { ...p, status } : null);
    } catch { toast('Failed to update status', 'error'); }
  };

  const updatePriority = async (id, priority) => {
    try {
      await adminUpdatePriority(id, priority);
      toast(`Priority updated to ${priority}`, 'success');
      loadIssues(); loadDashboard();
      setSelected(p => p ? { ...p, priority } : null);
    } catch { toast('Failed to update priority', 'error'); }
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32 }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Monitor, manage and resolve all civic complaints</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className={`btn btn-sm ${view==='issues' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('issues')}>
            <BarChart3 size={16}/> Issues
          </button>
          <button className={`btn btn-sm ${view==='users' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('users')}>
            <Users size={16}/> Users
          </button>
        </div>
      </div>

      {view === 'users' && <UserManagement />}

      {view === 'issues' && (
        <>
          {/* Stats row */}
          {stats && (
            <div className="stats-grid" style={{ marginBottom:32 }}>
              {[
                { label:'Total',       value: stats.totalComplaints,      color:'var(--text)',    icon: BarChart3 },
                { label:'Open',        value: stats.openComplaints,       color:'var(--primary)', icon: AlertTriangle },
                { label:'In Progress', value: stats.inProgressComplaints, color:'var(--warning)', icon: Clock },
                { label:'Resolved',    value: stats.resolvedComplaints,   color:'var(--success)', icon: CheckCircle2 },
                { label:'Rejected',    value: stats.rejectedComplaints,   color:'var(--danger)',  icon: XCircle },
                { label:'Critical',    value: stats.criticalComplaints,   color:'var(--danger)',  icon: AlertTriangle },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="stat-card">
                    <div className="stat-icon" style={{ background: s.color + '20' }}>
                      <Icon size={20} color={s.color} />
                    </div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Charts row */}
          {stats && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:32 }}>
              <div className="card">
                <h3 style={{ fontWeight:700, marginBottom:20, fontSize:'1rem' }}>Category Breakdown</h3>
                <MiniBarChart data={stats.categoryStats} color="var(--primary)" />
              </div>
              <div className="card">
                <h3 style={{ fontWeight:700, marginBottom:16, fontSize:'1rem' }}>7-Day Trend</h3>
                <TrendLine data={stats.dailyTrends} />
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, minWidth:220 }}>
              <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input className="form-control" style={{ paddingLeft:40 }} placeholder="Search issues..."
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadIssues()} />
            </div>
            <select className="form-control" style={{ width:'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
            <select className="form-control" style={{ width:'auto' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="form-control" style={{ width:'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={loadIssues}><Filter size={14}/> Filter</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterCategory(''); }}>
              Clear
            </button>
          </div>

          {/* Issues table */}
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
              <span className="spinner" style={{ width:40, height:40, borderColor:'rgba(99,102,241,.3)', borderTopColor:'var(--primary)' }} />
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
                    <th>Location</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>No issues found</td></tr>
                  ) : issues.map(issue => (
                    <tr key={issue.id} style={{ cursor:'pointer' }} onClick={() => setSelected(issue)}>
                      <td style={{ fontWeight:700, color:'var(--primary)' }}>#{issue.id}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{issue.title}</div>
                        {issue.duplicateOfId && (
                          <span className="badge badge-rejected" style={{ marginTop:4 }}><Copy size={10}/>Dup of #{issue.duplicateOfId}</span>
                        )}
                      </td>
                      <td><span className="badge" style={{ background:'var(--surface-2)', color:'var(--text-muted)' }}>{issue.category}</span></td>
                      <td><span className={`badge ${STATUS_CLS[issue.status]}`}>{issue.status.replace('_',' ')}</span></td>
                      <td><span className={`badge ${PRIO_CLS[issue.priority]}`}>{issue.priority}</span></td>
                      <td className="text-sm text-muted">
                        {issue.latitude ? `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}` : '—'}
                      </td>
                      <td className="text-sm text-muted">{new Date(issue.createdAt).toLocaleDateString('en-IN')}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', gap:8 }}>
                          <select className="form-control" style={{ padding:'6px 10px', fontSize:'.8rem', width:'auto' }}
                            value={issue.status}
                            onChange={e => updateStatus(issue.id, e.target.value)}>
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                          </select>
                          <select className="form-control" style={{ padding:'6px 10px', fontSize:'.8rem', width:'auto' }}
                            value={issue.priority}
                            onChange={e => updatePriority(issue.id, e.target.value)}>
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth:580 }}>
            <div className="modal-header">
              <h2 className="modal-title">Issue #{selected.id}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><XCircle size={16}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {selected.imageUrl && (
                <img src={getImageUrl(selected.imageUrl)} alt="issue"
                  style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:'var(--r-md)' }} />
              )}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span className={`badge ${STATUS_CLS[selected.status]}`}>{selected.status.replace('_',' ')}</span>
                <span className={`badge ${PRIO_CLS[selected.priority]}`}>{selected.priority}</span>
                <span className="badge" style={{ background:'var(--surface-2)', color:'var(--text-muted)' }}>{selected.category}</span>
              </div>
              <h3 style={{ fontWeight:700, fontSize:'1.1rem' }}>{selected.title}</h3>
              <p className="text-sm" style={{ lineHeight:1.7 }}>{selected.description}</p>
              {selected.duplicateOfId && (
                <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r-md)', padding:'10px 14px', display:'flex', gap:8 }}>
                  <Copy size={15} color="var(--danger)" style={{ flexShrink:0 }} />
                  <p className="text-sm" style={{ color:'var(--danger)' }}>Duplicate of Issue <b>#{selected.duplicateOfId}</b></p>
                </div>
              )}
              {selected.latitude && (
                <p className="text-sm text-muted" style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <MapPin size={13}/> {selected.latitude}, {selected.longitude}
                </p>
              )}
              <p className="text-xs text-muted">Submitted {new Date(selected.createdAt).toLocaleString('en-IN')}</p>
              {/* Inline actions */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', paddingTop:8, borderTop:'1px solid var(--border)' }}>
                <div className="form-group" style={{ flex:1 }}>
                  <label className="form-label">Update Status</label>
                  <select className="form-control" value={selected.status}
                    onChange={e => updateStatus(selected.id, e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex:1 }}>
                  <label className="form-label">Update Priority</label>
                  <select className="form-control" value={selected.priority}
                    onChange={e => updatePriority(selected.id, e.target.value)}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
