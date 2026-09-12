import { Link } from 'react-router-dom';
import { Clock, MapPin, Copy } from 'lucide-react';
import { getImageUrl } from '../services/api';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export default function IssueCard({ issue }) {
  return (
    <Link to={`/issues/${issue.id}`} className="card" style={{ display: 'block', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            {issue.duplicateOfId && (
              <span className="badge badge-rejected"><Copy size={12} />DUPLICATE #{issue.duplicateOfId}</span>
            )}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6, lineHeight: 1.4 }}>{issue.title}</h3>
          <p className="text-sm text-muted" style={{
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.6
          }}>
            {issue.description}
          </p>
        </div>
        {issue.imageUrl && (
          <img src={getImageUrl(issue.imageUrl)} alt="issue"
            style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 'var(--r-md)', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }} />
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} /> {new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {issue.latitude && (
          <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} /> {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
          </span>
        )}
        <span className="text-xs text-muted" style={{ marginLeft: 'auto', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
          #{issue.id} · {issue.category}
        </span>
      </div>
    </Link>
  );
}
