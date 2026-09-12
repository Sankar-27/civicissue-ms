import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, User, RefreshCw, ArrowLeft } from 'lucide-react';
import { adminGetUsers, adminUpdateRole } from '../services/api';
import { useToast } from '../components/ToastProvider';

export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetUsers({ page: 0, size: 100 });
      setUsers(data.content || []);
      setTotal(data.totalElements || 0);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const toggleRole = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'CITIZEN' : 'ADMIN';
    try {
      await adminUpdateRole(user.id, newRole);
      toast(`${user.name} is now ${newRole}`, 'success');
      load();
    } catch {
      toast('Failed to update role', 'error');
    }
  };

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="main-content">
      <Link to="/admin" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{total} registered users</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input className="form-control" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <span className="spinner" style={{ width: 28, height: 28, borderColor: 'rgba(99,102,241,.3)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.85rem' }}>
                        {(u.name || '?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted">{u.email}</td>
                  <td>
                    {u.role === 'ADMIN'
                      ? <span className="badge" style={{ background: 'rgba(99,102,241,.15)', color: 'var(--primary)' }}><ShieldCheck size={11} />Admin</span>
                      : <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}><User size={11} />Citizen</span>
                    }
                  </td>
                  <td className="text-sm text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.role === 'ADMIN' ? 'btn-outline' : 'btn-ghost'}`}
                      onClick={() => toggleRole(u)}>
                      {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
