import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';

const initials = (u) => `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || '?';

// Shows the email, or the phone number when the user signed up with one.
// If a user has both, the phone number appears underneath.
function ContactCell({ user }) {
  const primary = user.email || user.mobile_number;
  if (!primary) return <span className="muted">—</span>;
  const secondary = user.email && user.mobile_number ? user.mobile_number : null;
  return (
    <div className="contact-cell">
      <div className="contact-line">
        <span className="contact-kind">{user.email ? 'Email' : 'Phone'}</span>
        <span className="contact-main" title={primary}>{primary}</span>
      </div>
      {secondary && (
        <div className="contact-line">
          <span className="contact-kind">Phone</span>
          <span className="contact-sub">{secondary}</span>
        </div>
      )}
    </div>
  );
}

function PasswordCell({ value }) {
  if (!value) return <span className="muted">—</span>;
  return <code className="hash-cell" title={value}>{value}</code>;
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [accountType, setAccountType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wait a moment after typing before hitting the API.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Go back to page 1 whenever a filter changes.
  useEffect(() => { setPage(1); }, [debounced, status, accountType]);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/admin/users', { params: { search: debounced, status, account_type: accountType, page } })
      .then((res) => {
        if (cancelled) return;
        setUsers(res.data.data || []);
        setMeta({
          current_page: res.data.current_page || 1,
          last_page: res.data.last_page || 1,
          total: res.data.total || 0,
          from: res.data.from || 0,
          to: res.data.to || 0,
        });
        setError('');
      })
      .catch(() => { if (!cancelled) setError('Could not load users. Check that the API is running.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, status, accountType, page]);

  useEffect(() => load(), [load]);

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

  const hasFilters = Boolean(search || status || accountType);
  const clearFilters = () => { setSearch(''); setStatus(''); setAccountType(''); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="page-sub">
            {meta.total.toLocaleString()} {meta.total === 1 ? 'user' : 'users'}
            {hasFilters ? ' match your filters' : ' registered'}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            placeholder="Search by name, email, phone number or username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          <option value="">All account types</option>
          <option value="REGULAR">Regular</option>
          <option value="DUMMY">Dummy</option>
        </select>
        {hasFilters && <button type="button" className="btn-ghost" onClick={clearFilters}>Clear filters</button>}
      </div>

      {error && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th>User</th>
                <th>Email / Phone Number</th>
                <th>Account</th>
                <th>Password</th>
                <th>Registered</th>
                <th>Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody className={loading ? 'is-loading' : ''}>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="col-id muted">{u.id}</td>
                  <td>
                    <div className="user-cell">
                      <span className="user-avatar">{initials(u)}</span>
                      <div>
                        <div className="user-name">{u.first_name} {u.last_name}</div>
                        <div className="user-handle">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td><ContactCell user={u} /></td>
                  <td><span className={`badge type-${(u.account_type || 'regular').toLowerCase()}`}>{u.account_type === 'DUMMY' ? 'Dummy' : 'Regular'}</span></td>
                  <td><PasswordCell value={u.password} /></td>
                  <td className="nowrap">{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td><span className={`badge with-dot ${u.status.toLowerCase()}`}>{u.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span></td>
                  <td className="col-actions">
                    <div className="row-actions">
                      <button type="button" onClick={() => toggleStatus(u)}>
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                      {u.account_type === 'DUMMY' && (
                        <button type="button" className="danger" onClick={() => deleteUser(u)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-empty">
                    {hasFilters ? 'No users match these filters.' : 'No users have registered yet.'}
                  </td>
                </tr>
              )}
              {loading && users.length === 0 && (
                <tr><td colSpan={8} className="table-empty">Loading users…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span className="muted small">
            {meta.total > 0 ? `Showing ${meta.from}–${meta.to} of ${meta.total.toLocaleString()}` : 'No results'}
          </span>
          <div className="pager">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page {meta.current_page} of {meta.last_page}</span>
            <button type="button" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}