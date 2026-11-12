import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { IconLogoMark, IconDashboard, IconUsers, IconActivity, IconBeaker, IconLogout } from '../../components/Icons';
import '../../styles/admin.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) { /* ignore */ }
    logout();
    navigate('/admin/login');
  };

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Administrator';
  const initials = fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <IconLogoMark />
          <div>
            <strong>Phishbook</strong>
            <span>Administration</span>
          </div>
        </div>

        <nav>
          <NavLink to="/admin/dashboard"><IconDashboard /> Dashboard</NavLink>
          <NavLink to="/admin/users"><IconUsers /> User Management</NavLink>
          <NavLink to="/admin/login-activity"><IconActivity /> Login Activity</NavLink>
          <NavLink to="/admin/dummy-accounts"><IconBeaker /> Dummy Accounts</NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <span className="admin-avatar">{initials}</span>
            <span className="admin-user-name">{fullName}</span>
          </div>
          <button type="button" onClick={handleLogout}><IconLogout /> Sign out</button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}