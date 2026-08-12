import { useState, useEffect, useCallback } from 'react';
import {
  Plus, MapPin, Clock, RefreshCw, CheckCircle2,
  XCircle, AlertCircle, Copy, FileText, Image as ImageIcon
} from 'lucide-react';
import { getMyIssues, getImageUrl } from '../api';
import { useToast } from './ToastProvider';
import ReportIssueModal from './ReportIssueModal';

const STATUS_META = {
  OPEN:        { label: 'Open',        icon: AlertCircle,  cls: 'badge-open' },
  IN_PROGRESS: { label: 'In Progress', icon: RefreshCw,    cls: 'badge-in_progress' },
  RESOLVED:    { label: 'Resolved',    icon: CheckCircle2, cls: 'badge-resolved' },
  REJECTED:    { label: 'Rejected',    icon: XCircle,      cls: 'badge-rejected' },
};

const PRIORITY_META = {
  LOW:      { cls: 'badge-low' },
  MEDIUM:   { cls: 'badge-medium' },
  HIGH:     { cls: 'badge-high' },
  CRITICAL: { cls: 'badge-critical' },
};

export default function CitizenDashboard() {
  const toast = useToast();
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyIssues();
      setIssues(res.data);
    } catch {
      toast('Failed to load issues', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'ALL' ? issues : issues.filter(i => i.status === filter);

  const stats = {
    total:    issues.length,
    open:     issues.filter(i => i.status === 'OPEN').length,
    resolved: issues.filter(i => i.status === 'RESOLVED').length,
    rejected: issues.filter(i => i.status === 'REJECTED').length,
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32 }}>
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">Track and manage all your reported civic issues</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18}/> Report Issue
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        {[
          { label:'Total Filed',  value: stats.total,    color:'var(--primary)', icon: FileText },
          { label:'Open',         value: stats.open,     color:'var(--primary)', icon: AlertCircle },
          { label:'Resolved',     value: stats.resolved, color:'var(--success)',  icon: CheckCircle2 },
          { label:'Rejected',     value: stats.rejected, color:'var(--danger)',   icon: XCircle },
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

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        {['ALL','OPEN','IN_PROGRESS','RESOLVED','REJECTED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>
            {f.replace('_',' ')}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }} onClick={load}>
          <RefreshCw size={16}/> Refresh
        </button>
      </div>

      {/* Issues list */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
          <span className="spinner" style={{ width:40, height:40, borderColor:'rgba(99,102,241,.3)', borderTopColor:'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>No issues found</h3>
          <p>{ filter === 'ALL' ? 'You haven\'t reported any issues yet.' : `No ${filter.replace('_',' ').toLowerCase()} issues.` }</p>
          { filter === 'ALL' && <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={18}/> Report your first issue</button> }
        </div>
      ) : (
        <div className="issues-grid">
          {filtered.map(issue => {
            const sm = STATUS_META[issue.status] || STATUS_META.OPEN;
            const pm = PRIORITY_META[issue.priority] || PRIORITY_META.MEDIUM;
            const Icon = sm.icon;
            return (
              <div key={issue.id} className="card" style={{ cursor:'pointer' }} onClick={() => setSelected(issue)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                      <span className={`badge ${sm.cls}`}><Icon size={12}/>{sm.label}</span>
                      <span className={`badge ${pm.cls}`}>{issue.priority}</span>
                      {issue.duplicateOfId && (
                        <span className="badge badge-rejected"><Copy size={12}/>DUPLICATE #{issue.duplicateOfId}</span>
                      )}
                    </div>
                    <h3 style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:6, lineHeight:1.4 }}>{issue.title}</h3>
                    <p className="text-sm text-muted" style={{ overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', lineHeight:1.6 }}>
                      {issue.description}
                    </p>
                  </div>
                  {issue.imageUrl && (
                    <img src={getImageUrl(issue.imageUrl)} alt="issue"
                      style={{ width:88, height:88, objectFit:'cover', borderRadius:'var(--r-md)', flexShrink:0, boxShadow:'var(--shadow-sm)' }} />
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
                  <span className="text-xs text-muted" style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Clock size={12}/> {new Date(issue.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                  {issue.latitude && (
                    <span className="text-xs text-muted" style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <MapPin size={12}/> {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                    </span>
                  )}
                  <span className="text-xs text-muted" style={{ marginLeft:'auto', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.05em' }}>
                    #{issue.id} · {issue.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report modal */}
      {showForm && <ReportIssueModal onClose={() => setShowForm(false)} onSuccess={load} />}

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
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
                <span className={`badge ${STATUS_META[selected.status]?.cls}`}>{selected.status.replace('_',' ')}</span>
                <span className={`badge ${PRIORITY_META[selected.priority]?.cls}`}>{selected.priority}</span>
                <span className="badge" style={{ background:'var(--surface-2)', color:'var(--text-muted)' }}>{selected.category}</span>
              </div>
              <h3 style={{ fontWeight:700, fontSize:'1.1rem' }}>{selected.title}</h3>
              <p className="text-sm" style={{ lineHeight:1.7 }}>{selected.description}</p>
              {selected.duplicateOfId && (
                <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r-md)', padding:'10px 14px', display:'flex', gap:8 }}>
                  <Copy size={15} color="var(--danger)" style={{ flexShrink:0 }} />
                  <p className="text-sm" style={{ color:'var(--danger)' }}>
                    This issue is a duplicate of <b>Issue #{selected.duplicateOfId}</b> and was auto-rejected.
                  </p>
                </div>
              )}
              {selected.latitude && (
                <p className="text-sm text-muted" style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <MapPin size={13}/> {selected.latitude}, {selected.longitude}
                </p>
              )}
              <p className="text-xs text-muted">
                Submitted on {new Date(selected.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
