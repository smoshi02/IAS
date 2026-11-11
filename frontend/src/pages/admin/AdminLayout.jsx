import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { IconLogoMark, IconDashboard, IconUsers, IconActivity, IconBeaker, IconUser, IconLogout } from '../../components/Icons';
import '../../styles/admin.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) { /* ignore */ }
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo"><IconLogoMark /> PHISHBOOK<span>Admin Console</span></div>
        <nav>
          <NavLink to="/admin/dashboard"><IconDashboard /> Dashboard</NavLink>
          <NavLink to="/admin/users"><IconUsers /> User Management</NavLink>
          <NavLink to="/admin/login-activity"><IconActivity /> Login Activity</NavLink>
          <NavLink to="/admin/dummy-accounts"><IconBeaker /> Dummy Accounts</NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user"><IconUser /> {user?.first_name} {user?.last_name}</div>
          <button onClick={handleLogout}><IconLogout /> Sign Out</button>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}