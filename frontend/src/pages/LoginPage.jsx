import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

export default function LoginPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form);
      setAuth(data.token, {
        name: data.name,
        email: data.email,
        role: data.role,
        id: data.userId,
      });
      toast('Logged in successfully!', 'success');
      const role = (data.role || '').toUpperCase();
      navigate(role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      toast(err.response?.data?.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo"><Building2 size={30} color="#fff" /></div>
          <h1 className="auth-title">CivicIssue</h1>
          <p className="auth-subtitle">Smart civic complaint management platform</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-control" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com" required
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-control" style={{ paddingLeft: 36, paddingRight: 40 }}
                type={showPwd ? 'text' : 'password'} placeholder="••••••••" required
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-lg w-full" style={{ marginTop: 4 }} disabled={loading}>
            {loading ? <span className="spinner" /> : null} Sign In
          </button>
        </form>

        <div className="auth-footer">
          New here? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Create an account</Link>
        </div>
      </div>
    </div>
  );
}
