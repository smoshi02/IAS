import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

const REFRESH_MS = 30000;
const MIN_CHART_HEIGHT = 200;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 36 };

function describeError(err) {
  const status = err?.response?.status;
  if (!err?.response) {
    return `Can't reach the API at ${api.defaults.baseURL}. Is the Laravel server running?`;
  }
  if (status === 401) return 'Your session has expired. Sign out and log in again.';
  if (status === 403) return "This account doesn't have administrator access.";
  return `The server returned an error (${status}). Check the Laravel log for details.`;
}

function formatDay(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Pick a tick step (1, 2, 5, 10, 20, 50 ...) that gives at most 4 intervals.
function axisScale(maxValue) {
  for (let mag = 1; ; mag *= 10) {
    for (const m of [1, 2, 5]) {
      const step = m * mag;
      const intervals = Math.ceil(maxValue / step);
      if (intervals <= 4) return { step, max: Math.max(1, intervals) * step };
    }
  }
}

// Tracks the size of the element so the chart can fill whatever space the layout gives it.
function useSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 520, height: 230 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setSize({ width: el.clientWidth || 520, height: el.clientHeight || 230 });
    const ro = new ResizeObserver(([entry]) => setSize({
      width: Math.floor(entry.contentRect.width),
      height: Math.floor(entry.contentRect.height),
    }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

function BarChart({ rows, series }) {
  const [ref, size] = useSize();
  const width = size.width;
  const chartHeight = Math.max(MIN_CHART_HEIGHT, size.height);
  const values = rows.flatMap((d) => series.map((s) => d[s.key] || 0));
  const hasData = values.some((v) => v > 0);
  const { step, max } = axisScale(Math.max(0, ...values));

  const plotW = Math.max(120, width - MARGIN.left - MARGIN.right);
  const plotH = chartHeight - MARGIN.top - MARGIN.bottom;
  const band = rows.length ? plotW / rows.length : plotW;
  const barW = Math.min(series.length > 1 ? 16 : 26, (band * 0.62) / series.length);
  const gap = series.length > 1 ? 3 : 0;
  const groupW = barW * series.length + gap * (series.length - 1);
  const labelEvery = Math.max(1, Math.ceil(46 / band));
  const y = (v) => MARGIN.top + plotH - (v / max) * plotH;

  const ticks = [];
  for (let t = 0; t <= max; t += step) ticks.push(t);

  return (
    <div ref={ref} className="chart-box">
      <svg width={width} height={chartHeight} role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'chart-base' : 'chart-grid-line'} x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} />
            <text className="chart-tick" x={MARGIN.left - 8} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}

        {rows.map((d, i) => {
          const cx = MARGIN.left + band * i + band / 2;
          const showLabel = (rows.length - 1 - i) % labelEvery === 0;
          return (
            <g key={d.date}>
              {series.map((s, k) => {
                const v = d[s.key] || 0;
                const h = v > 0 ? Math.max(2, (v / max) * plotH) : 0;
                return (
                  <rect
                    key={s.key}
                    className={`chart-bar ${s.className || ''}`}
                    x={cx - groupW / 2 + k * (barW + gap)}
                    y={MARGIN.top + plotH - h}
                    width={barW}
                    height={h}
                    rx="2"
                  >
                    <title>{`${formatDay(d.date)} · ${s.label}: ${v}`}</title>
                  </rect>
                );
              })}
              {showLabel && (
                <text className="chart-tick" x={cx} y={chartHeight - 8} textAnchor="middle">{formatDay(d.date)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {!hasData && <div className="chart-empty">No activity in this period</div>}
    </div>
  );
}

function ChartCard({ title, legend, wide, children }) {
  return (
    <section className={`chart-card${wide ? ' wide' : ''}`}>
      <header className="chart-head">
        <h3>{title}</h3>
        {legend && (
          <div className="chart-legend">
            {legend.map((l) => (
              <span key={l.label}><i className={`legend-swatch ${l.className || ''}`} />{l.label}</span>
            ))}
          </div>
        )}
      </header>
      <div className="chart-body">{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [overTime, setOverTime] = useState([]);
  const [successVsFailed, setSuccessVsFailed] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      api.get('/admin/analytics/summary'),
      api.get('/admin/analytics/login-attempts-over-time'),
      api.get('/admin/analytics/success-vs-failed'),
      api.get('/admin/analytics/registration-statistics'),
    ]);

    // Keep whatever loaded; only replace a section when its request succeeded.
    if (results[0].status === 'fulfilled') setSummary(results[0].value.data);
    if (results[1].status === 'fulfilled') setOverTime(results[1].value.data);
    if (results[2].status === 'fulfilled') setSuccessVsFailed(results[2].value.data);
    if (results[3].status === 'fulfilled') setRegistrations(results[3].value.data);

    const firstFailure = results.find((r) => r.status === 'rejected');
    setError(firstFailure ? describeError(firstFailure.reason) : '');
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const attempts = summary?.total_login_attempts || 0;
  const pct = (n) => (attempts > 0 ? `${Math.round((n / attempts) * 100)}% of attempts` : null);

  const stats = [
    { label: 'Registered users', value: summary?.total_registered_users },
    { label: 'Active users', value: summary?.active_users },
    { label: 'Website visits', value: summary?.total_website_visits },
    { label: 'Login attempts', value: summary?.total_login_attempts },
    { label: 'Successful logins', value: summary?.successful_logins, note: pct(summary?.successful_logins || 0) },
    { label: 'Failed logins', value: summary?.failed_logins, note: pct(summary?.failed_logins || 0) },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-sub">Participant registrations and login activity.</p>
        </div>
        <div className="page-actions">
          {updatedAt && (
            <span className="muted small">
              Updated {updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button type="button" className="btn-outline" onClick={load}>Refresh</button>
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="stat-strip">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value == null ? '—' : s.value.toLocaleString()}</div>
            <div className="stat-note">{s.note || '\u00A0'}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <ChartCard title="Login attempts, last 14 days">
          {loading ? <p className="muted">Loading…</p> : (
            <BarChart rows={overTime} series={[{ key: 'total', label: 'Attempts' }]} />
          )}
        </ChartCard>

        <ChartCard
          title="Successful vs failed logins, last 14 days"
          legend={[{ label: 'Successful' }, { label: 'Failed', className: 'failed' }]}
        >
          {loading ? <p className="muted">Loading…</p> : (
            <BarChart
              rows={successVsFailed}
              series={[
                { key: 'successful', label: 'Successful' },
                { key: 'failed', label: 'Failed', className: 'failed' },
              ]}
            />
          )}
        </ChartCard>

        <ChartCard title="New registrations, last 14 days" wide>
          {loading ? <p className="muted">Loading…</p> : (
            <BarChart rows={registrations} series={[{ key: 'total', label: 'Registrations' }]} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}