import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, LogOut, Bell, Sun, Moon, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../services/api';
import { useState, useEffect, useCallback } from 'react';

export default function Navbar() {
  const { user, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('civic_theme') || 'light');
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(async () => {
    try { setUnread(await getUnreadCount()); } catch { setUnread(0); }
  }, []);

  useEffect(() => { loadUnread(); }, [loadUnread]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('civic_theme', next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to={isAdmin ? '/admin' : '/dashboard'} className="navbar-logo">
        <div className="logo-dot"><Building2 size={18} /></div>
        <span>CivicIssue</span>
        <span style={{
          fontSize: '.7rem', fontWeight: 600, padding: '2px 8px',
          background: role === 'ADMIN' ? 'rgba(99,102,241,.15)' : 'rgba(6,182,212,.12)',
          color: role === 'ADMIN' ? 'var(--primary)' : 'var(--accent)',
          borderRadius: 'var(--r-full)', marginLeft: 4
        }}>
          {role}
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
          background: 'var(--surface-2)', borderRadius: 'var(--r-full)', border: '1px solid var(--border)',
          fontSize: '.85rem', fontWeight: 600 }}>
          {role === 'ADMIN'
            ? <ShieldCheck size={14} color="var(--primary)" />
            : <User size={14} color="var(--text-muted)" />}
          <span className="text-muted">{user?.name || 'User'}</span>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={loadUnread} title="Refresh notifications"
          style={{ position: 'relative', padding: 8 }}>
          <Bell size={16} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 'var(--r-full)',
              background: 'var(--danger)', color: '#fff', fontSize: '.65rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px'
            }}>
              {unread}
            </span>
          )}
        </button>

        <button className="btn btn-ghost btn-sm" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Sign out">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </nav>
  );
}
