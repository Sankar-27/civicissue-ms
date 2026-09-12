import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function roleFromJWT(token) {
  const payload = decodeJWT(token);
  if (!payload) return 'CITIZEN';
  const auths = payload.authorities || payload.roles || [];
  const isAdmin = auths.some(a => {
    const s = typeof a === 'string' ? a : (a?.authority || '');
    return s.toUpperCase().includes('ADMIN');
  });
  return isAdmin ? 'ADMIN' : 'CITIZEN';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('civic_token'));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('civic_token');
    const payload = t ? decodeJWT(t) : null;
    return payload ? { name: payload.sub || payload.name || 'User' } : null;
  });
  const [role, setRole] = useState(() => {
    const t = localStorage.getItem('civic_token');
    return t ? roleFromJWT(t) : null;
  });

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      if (me?.role) setRole(String(me.role).toUpperCase());
    } catch {
      setUser((prev) => prev || { name: 'User' });
    }
  }, []);

  useEffect(() => {
    if (token) refreshUser();
  }, [token, refreshUser]);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('civic_token', newToken);
    setToken(newToken);
    setUser(userData || { name: 'User' });
    setRole(roleFromJWT(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('civic_token');
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const value = {
    token,
    user,
    role,
    isAuthenticated: !!token,
    isAdmin: role === 'ADMIN',
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
