import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { getNotifications, markRead, markAllRead } from '../services/api';
import { useToast } from '../components/ToastProvider';

const TYPE_ICON = {
  STATUS_UPDATE: AlertTriangle,
  COMMENT: Info,
  DEFAULT: Info,
};

function NotificationBody({ n }) {
  const Icon = TYPE_ICON[n.type] || Info;
  return (
    <>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: n.read ? 'var(--surface-3)' : 'rgba(99,102,241,.12)', color: n.read ? 'var(--text-muted)' : 'var(--primary)' }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{n.title}</span>
          {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
        </div>
        <p className="text-sm text-muted" style={{ marginTop: 2, lineHeight: 1.5 }}>{n.message}</p>
        <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleString('en-IN')}</span>
      </div>
    </>
  );
}

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setNotifications(await getNotifications()); }
    catch { toast('Failed to load notifications', 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (n) => {
    try {
      await markRead(n.id);
      setNotifications(p => p.map(x => x.id === n.id ? { ...x, read: true } : x));
    } catch { /* ignore */ }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setNotifications(p => p.map(x => ({ ...x, read: true })));
      toast('All notifications marked as read', 'success');
    } catch {
      toast('Failed to update notifications', 'error');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="main-content" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount} unread notifications</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={16} /> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={handleMarkAll}><CheckCheck size={16} /> Mark all read</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <span className="spinner" style={{ width: 40, height: 40, borderColor: 'rgba(99,102,241,.3)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={64} />
          <h3>No notifications</h3>
          <p>You have no notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(n => (
            <div key={n.id} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 18,
              background: n.read ? 'var(--surface)' : 'rgba(99,102,241,.04)',
              borderColor: n.read ? 'var(--border)' : 'rgba(99,102,241,.25)'
            }}>
              {n.relatedIssueId ? (
                <Link to={`/issues/${n.relatedIssueId}`} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <NotificationBody n={n} />
                </Link>
              ) : (
                <NotificationBody n={n} />
              )}
              {!n.read && (
                <button className="btn btn-ghost btn-sm" onClick={() => handleMarkRead(n)}>
                  <CheckCheck size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
