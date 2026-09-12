import { AlertCircle, CheckCircle2, Clock, MapPin, UserPlus } from 'lucide-react';
import StatusBadge from './StatusBadge';

const EVENT_ICONS = {
  OPEN: AlertCircle,
  UNDER_REVIEW: Clock,
  ASSIGNED: UserPlus,
  IN_PROGRESS: Clock,
  RESOLVED: CheckCircle2,
  CLOSED: Clock,
  REJECTED: AlertCircle,
};

export default function IssueTimeline({ issue, events }) {
  if (events && events.length > 0) {
    return (
      <div className="timeline">
        {events.map((event, i) => {
          const Icon = EVENT_ICONS[event.status] || Clock;
          return (
            <div key={i} className="timeline-item">
              <div className="timeline-dot" style={{
                background: event.status === 'REJECTED' ? 'rgba(239,68,68,.15)' : 'rgba(99,102,241,.12)',
                color: event.status === 'REJECTED' ? 'var(--danger)' : 'var(--primary)'
              }}>
                <Icon size={14} />
              </div>
              <div style={{ paddingTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StatusBadge status={event.status} />
                  <span className="text-xs text-muted">
                    {event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN') : ''}
                  </span>
                </div>
                {event.message && <p className="text-sm text-muted" style={{ marginTop: 4, lineHeight: 1.6 }}>{event.message}</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const items = [];
  if (issue?.createdAt) {
    items.push({
      icon: Clock,
      color: 'var(--primary)',
      label: 'Issue Reported',
      time: issue.createdAt,
      detail: issue.reportedBy?.name ? `Reported by ${issue.reportedBy.name}` : '',
    });
  }
  if (issue?.updatedAt && issue.updatedAt !== issue?.createdAt) {
    items.push({
      icon: CheckCircle2,
      color: 'var(--success)',
      label: `Status: ${String(issue.status || 'OPEN').replace('_', ' ')}`,
      time: issue.updatedAt,
      detail: issue.departmentName ? `Assigned to ${issue.departmentName}` : '',
    });
  }
  if (issue?.latitude && issue?.longitude) {
    items.push({
      icon: MapPin,
      color: 'var(--accent)',
      label: 'Location Recorded',
      time: null,
      detail: `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`,
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">No activity recorded yet.</p>;
  }

  return (
    <div className="timeline">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="timeline-item">
            <div className="timeline-dot" style={{ background: item.color + '18', color: item.color }}>
              <Icon size={14} />
            </div>
            <div style={{ paddingTop: 6 }}>
              <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{item.label}</div>
              {item.detail && <div className="text-sm text-muted" style={{ marginTop: 2 }}>{item.detail}</div>}
              {item.time && (
                <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                  {new Date(item.time).toLocaleString('en-IN')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
