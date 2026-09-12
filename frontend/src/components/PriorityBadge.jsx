const PRIORITY_CLS = {
  LOW: 'badge-low',
  MEDIUM: 'badge-medium',
  HIGH: 'badge-high',
  CRITICAL: 'badge-critical',
};

export default function PriorityBadge({ priority }) {
  return <span className={`badge ${PRIORITY_CLS[priority] || 'badge-medium'}`}>{priority || 'MEDIUM'}</span>;
}
