import { useState, useEffect } from 'react';
import { ShieldCheck, Sun, Moon, LogOut, User, Bell } from 'lucide-react';
import { ToastProvider } from './components/ToastProvider';
import Auth from './components/Auth';
import CitizenDashboard from './components/CitizenDashboard';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

// Decode JWT payload safely
function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function detectRole(token) {
  const payload = decodeJWT(token);
  if (!payload) return 'CITIZEN';
  // Spring Security puts roles in 'authorities' as [{authority:'ROLE_ADMIN'}]
  const auths = payload.authorities || payload.roles || [];
  const isAdmin = auths.some(a => {
    const s = typeof a === 'string' ? a : (a?.authority || '');
    return s.includes('ADMIN');
  });
  return isAdmin ? 'ADMIN' : 'CITIZEN';
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('civic_token'));
  const [role,  setRole]  = useState(() => {
    const t = localStorage.getItem('civic_token');
    return t ? detectRole(t) : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('civic_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('civic_theme', theme);
  }, [theme]);

  const handleLogin = (t, r) => {
    localStorage.setItem('civic_token', t);
    // Always re-detect role from the actual JWT
    const detectedRole = detectRole(t);
    setToken(t);
    setRole(detectedRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('civic_token');
    setToken(null);
    setRole(null);
  };

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

  const userName = (() => {
    if (!token) return '';
    const p = decodeJWT(token);
    return p?.sub || 'User';
  })();

  return (
    <ToastProvider>
      {!token ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <div style={{ minHeight: '100vh' }}>
          {/* ─── Navbar ─── */}
          <nav className="navbar">
            <div className="navbar-logo">
              <span>CivicIssue</span>
              <span style={{ fontSize:'.7rem', fontWeight:600, padding:'2px 8px',
                background: role === 'ADMIN' ? 'rgba(99,102,241,.15)' : 'rgba(6,182,212,.12)',
                color: role === 'ADMIN' ? 'var(--primary)' : 'var(--accent)',
                borderRadius:'var(--r-full)', marginLeft:4 }}>
                {role}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                background:'var(--surface-2)', borderRadius:'var(--r-full)', border:'1px solid var(--border)',
                fontSize:'.85rem', fontWeight:600 }}>
                <User size={14} color="var(--text-muted)"/>
                <span className="text-muted">{userName}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={toggleTheme} title="Toggle theme">
                {theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Log out">
                <LogOut size={16}/> Sign Out
              </button>
            </div>
          </nav>

          {/* ─── Dashboard ─── */}
          {role === 'ADMIN' ? <AdminDashboard /> : <CitizenDashboard />}
        </div>
      )}
    </ToastProvider>
  );
}
