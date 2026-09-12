import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, RefreshCw, Building2 } from 'lucide-react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../services/api';
import { useToast } from '../components/ToastProvider';

const EMPTY = { name: '', description: '', email: '' };

export default function DepartmentManagement() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setDepartments(await getDepartments()); }
    catch { toast('Failed to load departments', 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const startEdit = (d) => {
    setEditingId(d.id);
    setForm({ name: d.name, description: d.description || '', email: d.email || '' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateDepartment(editingId, form);
        toast('Department updated', 'success');
      } else {
        await createDepartment(form);
        toast('Department created', 'success');
      }
      resetForm();
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save department', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete department "${d.name}"?`)) return;
    try {
      await deleteDepartment(d.id);
      toast('Department deleted', 'success');
      load();
    } catch {
      toast('Failed to delete department', 'error');
    }
  };

  return (
    <div className="main-content">
      <Link to="/admin" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Department Management</h1>
          <p className="page-subtitle">{departments.length} departments</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} /> {editingId ? 'Edit Department' : 'New Department'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-control" required placeholder="e.g. Water Supply"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} placeholder="What does this department handle?"
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="dept@city.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : <Plus size={16} />} {editingId ? 'Save Changes' : 'Create Department'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>All Departments</h3>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
              <span className="spinner" style={{ width: 26, height: 26, borderColor: 'rgba(99,102,241,.3)', borderTopColor: 'var(--primary)' }} />
            </div>
          ) : departments.length === 0 ? (
            <p className="text-sm text-muted" style={{ padding: '20px 0' }}>No departments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {departments.map(d => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 16,
                  background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{d.name}</div>
                    {d.description && <p className="text-sm text-muted" style={{ marginTop: 2 }}>{d.description}</p>}
                    {d.email && <span className="text-xs text-muted">{d.email}</span>}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(d)}><Pencil size={14} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
