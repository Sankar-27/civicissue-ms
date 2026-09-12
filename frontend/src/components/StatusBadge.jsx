import { AlertCircle, RefreshCw, CheckCircle2, XCircle, Eye, ClipboardList, Inbox } from 'lucide-react';

const STATUS_META = {
  OPEN:        { label: 'Open',        icon: AlertCircle,  cls: 'badge-open' },
  UNDER_REVIEW:{ label: 'Under Review',icon: Eye,         cls: 'badge-open' },
  ASSIGNED:    { label: 'Assigned',    icon: ClipboardList, cls: 'badge-in_progress' },
  IN_PROGRESS: { label: 'In Progress', icon: RefreshCw,    cls: 'badge-in_progress' },
  RESOLVED:    { label: 'Resolved',    icon: CheckCircle2, cls: 'badge-resolved' },
  CLOSED:      { label: 'Closed',      icon: Inbox,        cls: 'badge-resolved' },
  REJECTED:    { label: 'Rejected',    icon: XCircle,      cls: 'badge-rejected' },
};

const FALLBACK = { label: 'Unknown', icon: AlertCircle, cls: 'badge-open' };

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || FALLBACK;
  const Icon = meta.icon;
  return (
    <span className={`badge ${meta.cls}`}>
      <Icon size={12} /> {meta.label}
    </span>
  );
}
