import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [overTime, setOverTime] = useState([]);
  const [successVsFailed, setSuccessVsFailed] = useState([]);

  useEffect(() => {
    api.get('/admin/analytics/summary').then((res) => setSummary(res.data));
    api.get('/admin/analytics/login-attempts-over-time').then((res) => setOverTime(res.data));
    api.get('/admin/analytics/success-vs-failed').then((res) => setSuccessVsFailed(res.data));
  }, []);

  const cards = summary
    ? [
        { label: 'Total Registered Users', value: summary.total_registered_users },
        { label: 'Total Website Visits', value: summary.total_website_visits },
        { label: 'Total Login Attempts', value: summary.total_login_attempts },
        { label: 'Successful Logins', value: summary.successful_logins },
        { label: 'Failed Logins', value: summary.failed_logins },
        { label: 'Active Users', value: summary.active_users },
      ]
    : [];

  const maxOverTime = Math.max(1, ...overTime.map((d) => d.total));

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="summary-grid">
        {cards.map((c) => (
          <div className="summary-card" key={c.label}>
            <div className="summary-value">{c.value ?? '—'}</div>
            <div className="summary-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Login Attempts Over Time (14d)</h3>
          <div className="bar-chart">
            {overTime.map((d) => (
              <div className="bar-col" key={d.date}>
                <div className="bar" style={{ height: `${(d.total / maxOverTime) * 100}%` }} />
                <span className="bar-label">{d.date.slice(5)}</span>
              </div>
            ))}
            {overTime.length === 0 && <p className="muted">No data yet.</p>}
          </div>
        </div>

        <div className="chart-card">
          <h3>Successful vs Failed Logins (14d)</h3>
          <table className="simple-table">
            <thead><tr><th>Date</th><th>Successful</th><th>Failed</th></tr></thead>
            <tbody>
              {successVsFailed.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td><td>{d.successful}</td><td>{d.failed}</td>
                </tr>
              ))}
              {successVsFailed.length === 0 && (
                <tr><td colSpan={3} className="muted">No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
