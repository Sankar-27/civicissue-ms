import { useState, useEffect, useCallback } from 'react';
import { Send, Trash2, MessageCircle, User } from 'lucide-react';
import { getComments, addComment, deleteComment } from '../services/api';
import { useToast } from './ToastProvider';
import { useAuth } from '../context/AuthContext';

export default function CommentSection({ issueId }) {
  const toast = useToast();
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setComments(await getComments(issueId)); }
    catch { setComments([]); }
    finally { setLoading(false); }
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await addComment(issueId, content.trim());
      setContent('');
      toast('Comment added', 'success');
      load();
    } catch {
      toast('Failed to add comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(issueId, commentId);
      toast('Comment deleted', 'success');
      setComments(p => p.filter(c => c.id !== commentId));
    } catch {
      toast('Failed to delete comment', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <MessageCircle size={18} color="var(--primary)" />
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Comments ({comments.length})</h3>
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <textarea className="form-control" rows={3} placeholder="Add a comment..."
          value={content} onChange={e => setContent(e.target.value)} style={{ minHeight: 60 }} />
        <button type="submit" className="btn btn-primary" disabled={submitting || !content.trim()} style={{ alignSelf: 'flex-end' }}>
          {submitting ? <span className="spinner" /> : <Send size={16} />}
        </button>
      </form>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <span className="spinner" style={{ width: 24, height: 24, borderColor: 'rgba(99,102,241,.3)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted" style={{ padding: '10px 0' }}>No comments yet. Be the first to comment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {comments.map(c => (
            <div key={c.id} style={{
              display: 'flex', gap: 12, padding: 16, background: 'var(--surface-2)',
              borderRadius: 'var(--r-md)', border: '1px solid var(--border)'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.9rem'
              }}>
                {c.author?.name ? c.author.name[0].toUpperCase() : <User size={16} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{c.author?.name || 'Unknown'}</span>
                  <span className="text-xs text-muted">
                    {c.author?.role === 'ADMIN' ? '· Admin' : ''}{' '}
                    · {new Date(c.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-sm" style={{ lineHeight: 1.6 }}>{c.content}</p>
                {(isAdmin || c.author?.id === user?.id) && (
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, padding: '4px 10px' }}
                    onClick={() => handleDelete(c.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
