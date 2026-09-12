import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Upload, FileImage, AlertCircle, ArrowLeft } from 'lucide-react';
import MapPicker from '../components/MapPicker';
import { createIssue, getNearbyIssues } from '../services/api';
import { useToast } from '../components/ToastProvider';

const CATEGORIES = ['ROAD', 'WATER', 'ELECTRICITY', 'SANITATION', 'STREETLIGHT', 'DRAINAGE', 'OTHER'];

export default function ReportIssuePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'ROAD', latitude: null, longitude: null, priority: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [duplicates, setDuplicates] = useState([]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleMapChange = async (lat, lon) => {
    set('latitude', lat);
    set('longitude', lon);
    try {
      const nearby = await getNearbyIssues(lat, lon, 100);
      setDuplicates(nearby.filter(n => n.status !== 'REJECTED'));
    } catch {
      setDuplicates([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast('Title and description are required.', 'error'); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      const request = {
        title: form.title,
        description: form.description,
        category: form.category,
        latitude: form.latitude ?? null,
        longitude: form.longitude ?? null,
      };
      if (form.priority) request.priority = form.priority;
      fd.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
      if (imageFile) fd.append('image', imageFile);
      const issue = await createIssue(fd);
      if (issue?.duplicateOfId) {
        toast('A similar issue already exists nearby — your complaint was linked as a duplicate.', 'warning');
      } else {
        toast('Issue reported successfully!', 'success');
      }
      navigate(`/issues/${issue.id}`);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit issue', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: 760, margin: '0 auto' }}>
      <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <h1 className="page-title">Report Civic Issue</h1>
      <p className="page-subtitle">Provide details so we can route your complaint to the right department</p>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">Issue Title *</label>
          <input className="form-control" required placeholder="e.g. Large pothole on MG Road"
            value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea className="form-control" required placeholder="Describe the issue in detail..." rows={4}
            value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority (optional)</label>
            <select className="form-control" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="">Default</option>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={14} /> Issue Location (click map to set)
          </label>
          <MapPicker lat={form.latitude} lon={form.longitude} onChange={handleMapChange} />
        </div>

        {duplicates.length > 0 && (
          <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)',
            borderRadius: 'var(--r-md)', padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle size={18} color="var(--warning)" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--warning)', fontWeight: 700 }}>Similar issues found nearby</p>
              <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                {duplicates.map(d => `#${d.id} (${d.title})`).join(', ')} — your complaint may be merged to avoid duplicates.
              </p>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileImage size={14} /> Supporting Image (optional)
          </label>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            border: '2px dashed var(--border)', borderRadius: 'var(--r-lg)', padding: '24px',
            cursor: 'pointer', transition: 'all var(--t-fast)', background: 'var(--surface-2)'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; }}>
            {imagePreview ? (
              <img src={imagePreview} alt="preview" style={{ maxHeight: 140, borderRadius: 'var(--r-md)', objectFit: 'cover', boxShadow: 'var(--shadow-sm)' }} />
            ) : (
              <><Upload size={32} color="var(--text-muted)" /><span className="text-sm text-muted">Click to upload image</span></>
            )}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
          </label>
        </div>

        <div style={{ background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)',
          borderRadius: 'var(--r-md)', padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color="var(--primary)" style={{ marginTop: 1, flexShrink: 0 }} />
          <p className="text-sm" style={{ color: 'var(--primary)', lineHeight: 1.6 }}>
            If a similar issue already exists nearby (within 100m), your complaint will be auto-linked to the existing one.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <Link to="/dashboard" className="btn btn-ghost">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" />Submitting...</> : 'Submit Issue'}
          </button>
        </div>
      </form>
    </div>
  );
}
