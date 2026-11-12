import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = () => {
    api.get('/admin/users', { params: { search, status } }).then((res) => {
      setUsers(res.data.data || []);
    });
  };

  useEffect(load, [search, status]);

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!window.confirm(`Set ${user.username} to ${newStatus}?`)) return;
    await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
    load();
  };

  const deleteUser = async (user) => {
    if (user.account_type !== 'DUMMY') {
      alert('Only dummy/test accounts can be deleted here.');
      return;
    }
    if (!window.confirm(`Permanently delete test account ${user.username}?`)) return;
    await api.delete(`/admin/users/${user.id}`);
    load();
  };

  return (
    <div>
      <h1>User Management</h1>
      <div className="toolbar">
        <input placeholder="Search by name, email, username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <p className="muted small">
        Passwords are stored as one-way bcrypt hashes. The value shown here cannot be reversed back into a real password.
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th><th>First Name</th><th>Last Name</th><th>Email</th>
            <th>Username</th><th>Password (hashed)</th><th>Registered</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td><td>{u.first_name}</td><td>{u.last_name}</td>
              <td>{u.email || u.mobile_number || '—'}</td><td>{u.username}</td>
              <td><code className="hash-cell" title={u.password}>{u.password}</code></td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
              <td><span className={`badge ${u.status.toLowerCase()}`}>{u.status}</span></td>
              <td>
                <button onClick={() => toggleStatus(u)}>
                  {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
                {u.account_type === 'DUMMY' && (
                  <button className="danger" onClick={() => deleteUser(u)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={9} className="muted">No users found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}