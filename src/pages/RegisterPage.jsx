import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import logoSekolah from '../assets/logo_sekolah.png';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nama, email, password, confirmPassword } = formData;

    // Validasi
    if (!nama || !email || !password || !confirmPassword) {
      return addToast('Semua field wajib diisi', 'error');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return addToast('Format email tidak valid', 'error');
    }

    if (password.length < 8) {
      return addToast('Password minimal 8 karakter', 'error');
    }

    if (password !== confirmPassword) {
      return addToast('Password dan konfirmasi tidak cocok', 'error');
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, email, password })
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        data = { message: 'Gagal menghubungi server (pastikan backend sudah direstart)' };
      }

      if (response.ok) {
        addToast('Registrasi berhasil! Silakan login', 'success');
        navigate('/login');
      } else {
        addToast(data.message || 'Gagal mendaftar', 'error');
      }
    } catch (error) {
      addToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src={logoSekolah} alt="Logo SDN 128" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2>Buat Akun Baru</h2>
          <p>Sistem Absensi SDN 128 Haurpancuh</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                className="form-input"
                type="text"
                name="nama"
                placeholder="Masukkan nama lengkap"
                value={formData.nama}
                onChange={handleChange}
                style={{ paddingLeft: 40 }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="Masukkan email valid"
                value={formData.email}
                onChange={handleChange}
                style={{ paddingLeft: 40 }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Minimal 8 karakter"
                value={formData.password}
                onChange={handleChange}
                style={{ paddingLeft: 40 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                className="form-input"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Ketik ulang password"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{ paddingLeft: 40 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 16 }}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-light)' }}>
            Sudah punya akun? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Login di sini</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
