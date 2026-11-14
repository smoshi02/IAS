import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';

const statuses = ['SUCCESSFUL_LOGIN', 'FAILED_LOGIN', 'INVALID_ACCOUNT', 'UNREGISTERED_USER'];

export default function LoginActivityPage() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    api.get('/admin/login-activities', { params: { search, status, date, page } })
      .then((res) => {
        if (cancelled) return;
        setActivities(res.data.data || []);
        setLastPage(res.data.last_page || 1);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) return; // the axios interceptor is already redirecting
        setError('Could not load login activity. Check that the API is running.');
      });
    return () => { cancelled = true; };
  }, [search, status, date, page]);

  useEffect(() => load(), [load]);

  // Auto-refresh every 15s so admins see new attempts without reloading.
  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (date) params.set('date', date);
    const token = localStorage.getItem('phishbook_token');
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    fetch(`${base}/admin/login-activities/export-csv?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Export failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'login_activities.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => setError('Could not export the CSV. Check that the API is running.'));
  };

  return (
    <div>
      <h1>Login Activity Monitoring</h1>
      <div className="toolbar">
        <input placeholder="Search identifier..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => { setPage(1); setDate(e.target.value); }} />
        <button onClick={exportCsv}>Export CSV</button>
      </div>

      {error && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Activity ID</th><th>Participant</th><th>Submitted Identifier</th>
            <th>Date</th><th>Time</th><th>Result</th><th>Password Entered</th><th>IP</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr key={a.activity_id}>
              <td>{a.activity_id}</td>
              <td>{a.participant_name || <span className="muted">Unregistered</span>}</td>
              <td>{a.submitted_identifier}</td>
              <td>{a.date}</td>
              <td>{a.time}</td>
              <td><span className={`badge status-${a.login_status.toLowerCase()}`}>{a.login_status.replaceAll('_', ' ')}</span></td>
              <td>{a.password_field_completed ? 'Yes' : 'No'}</td>
              <td>{a.ip_address || '—'}</td>
            </tr>
          ))}
          {activities.length === 0 && (
            <tr><td colSpan={8} className="muted">No login activity recorded yet.</td></tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {lastPage}</span>
        <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}