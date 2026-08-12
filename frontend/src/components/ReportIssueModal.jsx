import { useState } from 'react';
import { X, Upload, MapPin, FileImage, AlertCircle } from 'lucide-react';
import { createIssueJson, createIssueMultipart } from '../api';
import { useToast } from './ToastProvider';
import MapPicker from './MapPicker';

const CATEGORIES = ['ROAD','WATER','ELECTRICITY','SANITATION','STREETLIGHT','DRAINAGE','OTHER'];

export default function ReportIssueModal({ onClose, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'ROAD', latitude: null, longitude: null });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast('Title and description are required.', 'error'); return;
    }
    setLoading(true);
    try {
      let res;
      if (imageFile) {
        const fd = new FormData();
        fd.append('title',       form.title);
        fd.append('description', form.description);
        fd.append('category',    form.category);
        if (form.latitude  != null) fd.append('latitude',  form.latitude);
        if (form.longitude != null) fd.append('longitude', form.longitude);
        fd.append('image', imageFile);
        res = await createIssueMultipart(fd);
      } else {
        res = await createIssueJson({ ...form });
      }
      const msg = res.data;
      if (typeof msg === 'string' && msg.toLowerCase().includes('duplicate')) {
        toast(msg, 'warning');
      } else {
        toast('Issue reported successfully!', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit issue', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'var(--r-md)', background:'linear-gradient(135deg, var(--primary), var(--accent))', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MapPin size={18} color="#fff" />
            </div>
            Report Civic Issue
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
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

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <MapPin size={14}/> Issue Location (click map to set)
            </label>
            <MapPicker lat={form.latitude} lon={form.longitude}
              onChange={(la, lo) => { set('latitude', la); set('longitude', lo); }} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <FileImage size={14}/> Supporting Image (optional)
            </label>
            <label style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12,
              border:'2px dashed var(--border)', borderRadius:'var(--r-lg)', padding:'24px',
              cursor:'pointer', transition:'all var(--t-fast)', background:'var(--surface-2)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; }}>
              {imagePreview ? (
                <img src={imagePreview} alt="preview" style={{ maxHeight:140, borderRadius:'var(--r-md)', objectFit:'cover', boxShadow:'var(--shadow-sm)' }} />
              ) : (
                <><Upload size={32} color="var(--text-muted)"/><span className="text-sm text-muted">Click to upload image</span></>
              )}
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleImage} />
            </label>
          </div>

          <div style={{ background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.25)',
            borderRadius:'var(--r-md)', padding:'14px 18px', display:'flex', gap:10, alignItems:'flex-start' }}>
            <AlertCircle size={18} color="var(--primary)" style={{ marginTop:1, flexShrink:0 }} />
            <p className="text-sm" style={{ color:'var(--primary)', lineHeight:1.6 }}>
              If a similar issue already exists nearby (within 100m), your complaint will be auto-linked to the existing one.
            </p>
          </div>

          <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner"/>Submitting...</> : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
