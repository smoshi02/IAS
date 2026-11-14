import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';

export default function DummyAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', test_username: '', predefined_test_password: '' });
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    api.get('/admin/dummy-accounts', { params: { search, status } })
      .then((res) => {
        if (cancelled) return;
        setAccounts(res.data.data || []);
        setLoadError('');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) return; // the axios interceptor is already redirecting
        setLoadError('Could not load dummy accounts. Check that the API is running.');
      });
    return () => { cancelled = true; };
  }, [search, status]);

  useEffect(() => load(), [load]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createAccount = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/dummy-accounts', form);
      setForm({ first_name: '', last_name: '', test_username: '', predefined_test_password: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create dummy account.');
    }
  };

  const toggleStatus = async (acc) => {
    const newStatus = acc.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/dummy-accounts/${acc.id}/status`, { status: newStatus });
      load();
    } catch (err) {
      setError('Could not update that account. Please try again.');
    }
  };

  return (
    <div>
      <h1>Dummy Account Management</h1>
      <p className="muted">
        Only predefined test credentials generated here are ever shown in the admin interface.
        These accounts exist solely for the controlled academic exercise.
      </p>

      <form className="inline-form" onSubmit={createAccount}>
        <input name="first_name" placeholder="First name" value={form.first_name} onChange={handleChange} required />
        <input name="last_name" placeholder="Last name" value={form.last_name} onChange={handleChange} required />
        <input name="test_username" placeholder="Test username" value={form.test_username} onChange={handleChange} required />
        <input name="predefined_test_password" placeholder="Predefined test password" value={form.predefined_test_password} onChange={handleChange} required />
        <button type="submit" className="btn-primary">Generate</button>
      </form>
      {error && <div className="auth-error">{error}</div>}
      {loadError && <div className="auth-error">{loadError}</div>}

      <div className="toolbar">
        <input placeholder="Search username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Test Username</th><th>Test Password</th>
            <th>Status</th><th>Created</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.user ? `${a.user.first_name} ${a.user.last_name}` : '—'}</td>
              <td>{a.test_username}</td>
              <td><code>{a.predefined_test_password_plaintext}</code></td>
              <td><span className={`badge ${a.status.toLowerCase()}`}>{a.status}</span></td>
              <td>{new Date(a.created_at).toLocaleDateString()}</td>
              <td>
                <button onClick={() => toggleStatus(a)}>
                  {a.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
          {accounts.length === 0 && (
            <tr><td colSpan={7} className="muted">No dummy accounts yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}