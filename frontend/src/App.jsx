import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireUser, RequireAdmin } from './components/ProtectedRoute';

import Consent from './pages/Consent';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import LoginActivityPage from './pages/admin/LoginActivityPage';
import DummyAccounts from './pages/admin/DummyAccounts';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Participants always land on the consent/disclosure screen first */}
          <Route path="/" element={<Consent />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/home" element={<RequireUser><Home /></RequireUser>} />
          <Route path="/profile" element={<RequireUser><Profile /></RequireUser>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={<RequireAdmin><AdminLayout /></RequireAdmin>}
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="login-activity" element={<LoginActivityPage />} />
            <Route path="dummy-accounts" element={<DummyAccounts />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
