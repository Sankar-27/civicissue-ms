import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo"><Building2 size={30} color="#fff" /></div>
          <h1 className="auth-title">404</h1>
          <p className="auth-subtitle">Oops! The page you're looking for doesn't exist.</p>
        </div>
        <div className="auth-footer">
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700 }}>Back to home</Link>
        </div>
      </div>
    </div>
  );
}
