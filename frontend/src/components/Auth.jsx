import { useState } from 'react';
import { ShieldCheck, User, Eye, EyeOff, Mail, Lock, UserCircle } from 'lucide-react';
import { login, register } from '../api';
import { useToast } from './ToastProvider';

export default function Auth({ onLogin }) {
  const toast = useToast();
  const [tab, setTab]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [loginForm, setLoginForm]     = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(loginForm);
      const token = res.data.token;
      localStorage.setItem('civic_token', token);
      // decode role from JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || extractRoleFromJWT(token);
      toast('Logged in successfully!', 'success');
      onLogin(token, role);
    } catch (err) {
      toast(err.response?.data?.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerForm);
      toast('Account created! Please log in.', 'success');
      setTab('login');
      setLoginForm({ email: registerForm.email, password: registerForm.password });
    } catch (err) {
      toast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">CivicIssue</h1>
          <p className="auth-subtitle">Smart civic complaint management platform</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input className="form-control" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com" required
                  value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input className="form-control" style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPwd ? 'text' : 'password'} placeholder="••••••••" required
                  value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-lg w-full" style={{ marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" /> : null} Sign In
            </button>
            <div className="auth-footer">
              Default admin: <b>admin@civicissue.com</b> / <b>admin123</b>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserCircle size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input className="form-control" style={{ paddingLeft: 36 }} type="text" placeholder="John Citizen" required
                  value={registerForm.name} onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input className="form-control" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com" required
                  value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input className="form-control" style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPwd ? 'text' : 'password'} placeholder="Min. 6 characters" required minLength={6}
                  value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-lg w-full" style={{ marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" /> : null} Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Extract role from Spring Security JWT authorities
function extractRoleFromJWT(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Spring Security encodes roles as ["ROLE_ADMIN"] or similar
    const auths = payload.authorities || payload.roles || [];
    if (Array.isArray(auths)) {
      const found = auths.find(a => (typeof a === 'string' ? a : a.authority || '').includes('ADMIN'));
      return found ? 'ADMIN' : 'CITIZEN';
    }
    return 'CITIZEN';
  } catch { return 'CITIZEN'; }
}
