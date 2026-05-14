import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoutModal from '../common/LogoutModal';
import {
  LayoutDashboard,
  ScanLine,
  Users,
  ClipboardList,
  CalendarDays,
  CalendarRange,
  LogOut,
  GraduationCap,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scan', label: 'Scan Absensi', icon: ScanLine },
  { path: '/siswa', label: 'Data Siswa', icon: Users },
  { path: '/riwayat', label: 'Daftar Absensi', icon: ClipboardList },
  { path: '/rekap-mingguan', label: 'Rekap Mingguan', icon: CalendarDays },
  { path: '/rekap-bulanan', label: 'Rekap Bulanan', icon: CalendarRange },
];

export default function Sidebar({ isOpen, onClose }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <GraduationCap size={24} color="white" />
          </div>
          <div className="sidebar-brand-text">
            <h3>SDN 128</h3>
            <p>Haurpancuh</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Menu Utama</span>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-link logout-link" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={confirmLogout} 
      />
    </>
  );
}
