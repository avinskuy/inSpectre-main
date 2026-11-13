import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from './api.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    try { const data = await apiGet('/auth/me'); setUser(data.user || null); }
    catch { setUser(null); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);
  const login = async (credentials) => { const data = await apiPost('/auth/login', credentials); setUser(data.user); return data.user; };
  const register = async (details) => { const data = await apiPost('/auth/register', details); setUser(data.user); return data.user; };
  const logout = async () => { try { await apiPost('/auth/logout', {}); } finally { setUser(null); } };
  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  return value;
}
