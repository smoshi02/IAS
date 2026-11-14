import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

const REFRESH_MS = 30000;
const MIN_CHART_HEIGHT = 220;
const MARGIN = { top: 16, right: 14, bottom: 30, left: 40 };

const C = {
  blue: '#2C6BED',
  green: '#1E9E5A',
  orange: '#E8833A',
  grey: '#C3CBE4',
};

/* ── helpers ─────────────────────────────────────────────── */

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

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Picks a tick step (1, 2, 5, 10, 20, 50 ...) that gives at most 4 intervals.
function axisScale(maxValue) {
  for (let mag = 1; ; mag *= 10) {
    for (const m of [1, 2, 5]) {
      const step = m * mag;
      const intervals = Math.ceil(maxValue / step);
      if (intervals <= 4) return { step, max: Math.max(1, intervals) * step };
    }
  }
}

// Smooth curve through points, clamped so it never dips below the baseline.
function smoothPath(pts, top, bottom) {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  const t = 0.18;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = clamp(p1[1] + (p2[1] - p0[1]) * t, top, bottom);
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = clamp(p2[1] - (p3[1] - p1[1]) * t, top, bottom);
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// Bar with rounded top corners only.
function barPath(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

// Tracks the size of the element so the chart fills whatever space the layout gives it.
function useSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 520, height: 240 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setSize({ width: el.clientWidth || 520, height: el.clientHeight || 240 });
    const ro = new ResizeObserver(([entry]) => setSize({
      width: Math.floor(entry.contentRect.width),
      height: Math.floor(entry.contentRect.height),
    }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

/* ── charts ──────────────────────────────────────────────── */

// variant="area" draws a smooth line with a soft fill; variant="bar" draws grouped bars.
function Chart({ rows, series, variant = 'bar' }) {
  const [ref, size] = useSize();
  const [hover, setHover] = useState(null);
  const uid = useRef(`c${Math.random().toString(36).slice(2, 8)}`).current;

  const width = size.width;
  const height = Math.max(MIN_CHART_HEIGHT, size.height);
  const values = rows.flatMap((d) => series.map((s) => d[s.key] || 0));
  const hasData = values.some((v) => v > 0);
  const { step, max } = axisScale(Math.max(0, ...values));

  const plotW = Math.max(120, width - MARGIN.left - MARGIN.right);
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const baseY = MARGIN.top + plotH;
  const band = rows.length ? plotW / rows.length : plotW;
  const cx = (i) => MARGIN.left + band * i + band / 2;
  const y = (v) => baseY - (v / max) * plotH;

  const barW = Math.min(series.length > 1 ? 14 : 24, (band * 0.62) / series.length);
  const gap = series.length > 1 ? 3 : 0;
  const groupW = barW * series.length + gap * (series.length - 1);
  const labelEvery = Math.max(1, Math.ceil(48 / band));

  const ticks = [];
  for (let t = 0; t <= max; t += step) ticks.push(t);

  const onMove = (e) => {
    if (!rows.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - rect.left - MARGIN.left) / band);
    setHover(clamp(i, 0, rows.length - 1));
  };

  const hovered = hover != null ? rows[hover] : null;
  const tipLeft = hover != null ? clamp(cx(hover), 80, width - 80) : 0;

  return (
    <div ref={ref} className="chart-box">
      <svg width={width} height={height} role="img" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={variant === 'area' ? 0.28 : 1} />
              <stop offset="100%" stopColor={s.color} stopOpacity={variant === 'area' ? 0 : 0.6} />
            </linearGradient>
          ))}
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'chart-base' : 'chart-grid-line'} x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} />
            <text className="chart-tick" x={MARGIN.left - 10} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}

        {hover != null && variant === 'bar' && (
          <rect className="chart-hover-band" x={MARGIN.left + band * hover} y={MARGIN.top} width={band} height={plotH} rx="6" />
        )}
        {hover != null && variant === 'area' && (
          <line className="chart-guide" x1={cx(hover)} x2={cx(hover)} y1={MARGIN.top} y2={baseY} />
        )}

        {variant === 'area' && series.map((s) => {
          const pts = rows.map((d, i) => [cx(i), y(d[s.key] || 0)]);
          if (!pts.length) return null;
          const line = smoothPath(pts, MARGIN.top, baseY);
          const area = `${line} L${pts[pts.length - 1][0]},${baseY} L${pts[0][0]},${baseY} Z`;
          return (
            <g key={s.key}>
              <path d={area} fill={`url(#${uid}-${s.key})`} />
              <path d={line} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              {hover != null && (
                <circle cx={cx(hover)} cy={y(rows[hover][s.key] || 0)} r="5" fill="#fff" stroke={s.color} strokeWidth="2.4" />
              )}
            </g>
          );
        })}

        {variant === 'bar' && rows.map((d, i) => (
          <g key={d.date}>
            {series.map((s, k) => {
              const v = d[s.key] || 0;
              if (v <= 0) return null;
              const h = Math.max(3, (v / max) * plotH);
              return (
                <path
                  key={s.key}
                  d={barPath(cx(i) - groupW / 2 + k * (barW + gap), baseY - h, barW, h, 4)}
                  fill={`url(#${uid}-${s.key})`}
                />
              );
            })}
          </g>
        ))}

        {rows.map((d, i) => (((rows.length - 1 - i) % labelEvery === 0) ? (
          <text key={d.date} className={`chart-tick${hover === i ? ' is-active' : ''}`} x={cx(i)} y={height - 8} textAnchor="middle">
            {formatDay(d.date)}
          </text>
        ) : null))}
      </svg>

      {hovered && (
        <div className="chart-tip" style={{ left: tipLeft }}>
          <div className="chart-tip-date">{formatDay(hovered.date)}</div>
          {series.map((s) => (
            <div className="chart-tip-row" key={s.key}>
              <i style={{ background: s.color }} />
              <span>{s.label}</span>
              <strong>{(hovered[s.key] || 0).toLocaleString()}</strong>
            </div>
          ))}
        </div>
      )}

      {!hasData && <div className="chart-empty">No activity in this period</div>}
    </div>
  );
}

// Overall split of login attempts, with the success rate in the middle.
function Donut({ summary }) {
  const total = summary?.total_login_attempts || 0;
  const ok = summary?.successful_logins || 0;
  const bad = summary?.failed_logins || 0;
  const other = Math.max(0, total - ok - bad);

  const r = 54;
  const circ = 2 * Math.PI * r;
  const parts = [
    { label: 'Successful', value: ok, color: C.green },
    { label: 'Failed', value: bad, color: C.orange },
    { label: 'Other', value: other, color: C.grey, hint: 'Unknown or inactive accounts' },
  ];

  let offset = 0;
  const arcs = parts.map((p) => {
    const len = total ? (p.value / total) * circ : 0;
    const arc = { ...p, len, offset };
    offset += len;
    return arc;
  });
  const rate = total ? Math.round((ok / total) * 100) : null;

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Login outcome split">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#EEF2FB" strokeWidth="16" />
        {arcs.map((a) => a.len > 0 && (
          <circle
            key={a.label}
            cx="70" cy="70" r={r} fill="none"
            stroke={a.color} strokeWidth="16"
            strokeDasharray={`${Math.max(0, a.len - 2)} ${circ}`}
            strokeDashoffset={-a.offset}
            transform="rotate(-90 70 70)"
          />
        ))}
        <text x="70" y="68" textAnchor="middle" className="donut-value">{rate == null ? '—' : `${rate}%`}</text>
        <text x="70" y="86" textAnchor="middle" className="donut-label">success rate</text>
      </svg>

      <ul className="donut-legend">
        {parts.map((p) => (
          <li key={p.label} title={p.hint}>
            <i style={{ background: p.color }} />
            <span>{p.label}</span>
            <strong>{p.value.toLocaleString()}</strong>
            <em>{total ? `${Math.round((p.value / total) * 100)}%` : '—'}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartCard({ title, sub, legend, span = 'span-6', children }) {
  return (
    <section className={`chart-card ${span}`}>
      <header className="chart-head">
        <div>
          <h3>{title}</h3>
          {sub && <p>{sub}</p>}
        </div>
        {legend && (
          <div className="chart-legend">
            {legend.map((l) => (
              <span key={l.label}><i className="legend-swatch" style={{ background: l.color }} />{l.label}</span>
            ))}
          </div>
        )}
      </header>
      <div className="chart-body">{children}</div>
    </section>
  );
}

const Skeleton = () => <div className="skeleton" />;

/* ── page ────────────────────────────────────────────────── */

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
    { label: 'Registered users', value: summary?.total_registered_users, accent: C.blue },
    { label: 'Active users', value: summary?.active_users, accent: C.green },
    { label: 'Website visits', value: summary?.total_website_visits, accent: '#7B5CE6' },
    { label: 'Login attempts', value: summary?.total_login_attempts, accent: '#1C3FAE' },
    { label: 'Successful logins', value: summary?.successful_logins, note: pct(summary?.successful_logins || 0), accent: C.green },
    { label: 'Failed logins', value: summary?.failed_logins, note: pct(summary?.failed_logins || 0), accent: C.orange },
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
            <span className="live-pill" title="Refreshes automatically every 30 seconds">
              <i className="live-dot" />
              Updated {updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button type="button" className="btn-outline" onClick={load}>Refresh</button>
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="stat-strip">
        {stats.map((s) => (
          <div className="stat" key={s.label} style={{ '--accent': s.accent }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value == null ? '—' : s.value.toLocaleString()}</div>
            <div className="stat-note">{s.note || '\u00A0'}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <ChartCard title="Login attempts" sub="Last 14 days" span="span-8">
          {loading ? <Skeleton /> : (
            <Chart rows={overTime} variant="area" series={[{ key: 'total', label: 'Attempts', color: C.blue }]} />
          )}
        </ChartCard>

        <ChartCard title="Login outcomes" sub="All time" span="span-4">
          {loading ? <Skeleton /> : <Donut summary={summary} />}
        </ChartCard>

        <ChartCard
          title="Successful vs failed logins"
          sub="Last 14 days"
          span="span-6"
          legend={[{ label: 'Successful', color: C.green }, { label: 'Failed', color: C.orange }]}
        >
          {loading ? <Skeleton /> : (
            <Chart
              rows={successVsFailed}
              variant="bar"
              series={[
                { key: 'successful', label: 'Successful', color: C.green },
                { key: 'failed', label: 'Failed', color: C.orange },
              ]}
            />
          )}
        </ChartCard>

        <ChartCard title="New registrations" sub="Last 14 days" span="span-6">
          {loading ? <Skeleton /> : (
            <Chart rows={registrations} variant="area" series={[{ key: 'total', label: 'Registrations', color: '#7B5CE6' }]} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}