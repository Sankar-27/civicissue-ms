import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Copy, User } from 'lucide-react';
import { getIssueById, getImageUrl } from '../services/api';
import { useToast } from '../components/ToastProvider';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import IssueTimeline from '../components/IssueTimeline';
import CommentSection from '../components/CommentSection';

export default function IssueDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setIssue(await getIssueById(id)); }
    catch { toast('Failed to load issue', 'error'); }
    finally { setLoading(false); }
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <span className="spinner" style={{ width: 40, height: 40, borderColor: 'rgba(99,102,241,.3)', borderTopColor: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="main-content">
        <div className="empty-state"><h3>Issue not found</h3></div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {issue.imageUrl && (
            <img src={getImageUrl(issue.imageUrl)} alt="issue"
              style={{ width: 260, maxWidth: '100%', height: 220, objectFit: 'cover', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)' }} />
          )}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>#{issue.id} · {issue.title}</h1>
              <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>Submitted {new Date(issue.createdAt).toLocaleDateString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{issue.category}</span>
            </div>

            <p className="text-sm" style={{ lineHeight: 1.7 }}>{issue.description}</p>

            {issue.duplicateOfId && (
              <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 'var(--r-md)', padding: '10px 14px', display: 'flex', gap: 8, marginTop: 16 }}>
                <Copy size={15} color="var(--danger)" style={{ flexShrink: 0 }} />
                <p className="text-sm" style={{ color: 'var(--danger)' }}>
                  This issue is a duplicate of <b>Issue #{issue.duplicateOfId}</b>.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
              {issue.latitude && (
                <span className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} /> {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                </span>
              )}
              {issue.departmentName && (
                <span className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} /> Assigned to {issue.departmentName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>Activity Timeline</h3>
          <IssueTimeline issue={issue} />
        </div>
        <div className="card">
          <CommentSection issueId={issue.id} />
        </div>
      </div>
    </div>
  );
}
