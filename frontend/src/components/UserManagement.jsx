import { useState, useEffect } from 'react';
import { Users, ShieldCheck, User, RefreshCw } from 'lucide-react';
import { adminGetUsers, adminUpdateRole } from '../api';
import { useToast } from './ToastProvider';

export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await adminGetUsers(); setUsers(r.data); }
    catch { toast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'CITIZEN' : 'ADMIN';
    try {
      await adminUpdateRole(user.id, newRole);
      toast(`${user.name} is now ${newRole}`, 'success');
      load();
    } catch { toast('Failed to update role', 'error'); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h2 style={{ fontWeight:700, fontSize:'1.1rem' }}>User Management</h2>
          <p className="text-sm text-muted">{users.length} registered users</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14}/> Refresh</button>
      </div>

      <div style={{ marginBottom:14 }}>
        <input className="form-control" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
          <span className="spinner" style={{ width:28, height:28, borderColor:'rgba(99,102,241,.3)', borderTopColor:'var(--primary)' }} />
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight:700, color:'var(--text-muted)' }}>{u.id}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary), var(--accent))',
                        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'.85rem' }}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight:600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted">{u.email}</td>
                  <td>
                    {u.role === 'ADMIN'
                      ? <span className="badge" style={{ background:'rgba(99,102,241,.15)', color:'var(--primary)' }}><ShieldCheck size={11}/>Admin</span>
                      : <span className="badge" style={{ background:'var(--surface-2)', color:'var(--text-muted)' }}><User size={11}/>Citizen</span>
                    }
                  </td>
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
