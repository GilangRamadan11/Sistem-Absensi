import { createContext, useContext, useState, useEffect } from 'react';
import { GURU_CREDENTIALS } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('absensi_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    if (username === GURU_CREDENTIALS.username && password === GURU_CREDENTIALS.password) {
      const userData = { username, nama: GURU_CREDENTIALS.nama };
      setUser(userData);
      localStorage.setItem('absensi_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: 'Username atau password salah!' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('absensi_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider');
  return ctx;
}
