import { Menu } from 'lucide-react';

export default function Header({ onToggleSidebar }) {
  return (
    <header className="mobile-header">
      <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
        <Menu size={24} />
      </button>
      <h3>SDN 128 Haurpancuh</h3>
      <div style={{ width: 40 }} />
    </header>
  );
}
