import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { IconUserPlus, IconUserCheck, IconUsers } from './Icons';
import { avatarOf, timeAgo } from '../utils/people';

function PersonCard({ person, sub, children }) {
  return (
    <div className="friend-card">
      <img className="friend-photo" src={avatarOf(person, 320)} alt={person.name} />
      <div className="friend-body">
        <div className="friend-name">{person.name}</div>
        {sub && <div className="friend-sub">{sub}</div>}
        <div className="friend-actions">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <section className="friends-section">
      <h3 className="friends-title">
        {title}
        {count > 0 && <span className="count-pill">{count}</span>}
      </h3>
      {children}
    </section>
  );
}

export default function FriendsPanel({ query, tick, onChange }) {
  const [data, setData] = useState({ friends: [], requests: [], suggestions: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [unfriendTarget, setUnfriendTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/friends/overview');
      setData(res.data);
    } catch (e) {
      /* keep the last good data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  const run = async (key, fn) => {
    setBusy((b) => ({ ...b, [key]: true }));
    try { await fn(); } catch (e) { /* reload below shows the real state */ }
    await load();
    if (onChange) await onChange();
    setBusy((b) => ({ ...b, [key]: false }));
  };

  const add = (p) => run(`p${p.id}`, () => api.post(`/friends/request/${p.id}`));
  const cancel = (p) => run(`p${p.id}`, () => api.delete(`/friends/${p.friendship_id}`));
  const confirm = (r) => run(`r${r.friendship_id}`, () => api.post(`/friends/${r.friendship_id}/accept`));
  const remove = (r) => run(`r${r.friendship_id}`, () => api.delete(`/friends/${r.friendship_id}`));
  const unfriend = async () => {
    const f = unfriendTarget;
    setUnfriendTarget(null);
    if (f) await run(`f${f.friendship_id}`, () => api.delete(`/friends/${f.friendship_id}`));
  };

  const q = (query || '').trim().toLowerCase();
  const match = (p) => !q || p.name.toLowerCase().includes(q);
  const requests = data.requests.filter(match);
  const friends = data.friends.filter(match);
  const suggestions = data.suggestions.filter(match);

  if (loading) return <div className="empty-state">Loading…</div>;

  return (
    <div className="friends-panel">
      {requests.length > 0 && (
        <Section title="Friend requests" count={requests.length}>
          <div className="friend-grid">
            {requests.map((r) => (
              <PersonCard key={r.friendship_id} person={r} sub={timeAgo(r.created_at)}>
                <button type="button" className="fb-btn primary block" disabled={busy[`r${r.friendship_id}`]} onClick={() => confirm(r)}>Confirm</button>
                <button type="button" className="fb-btn secondary block" disabled={busy[`r${r.friendship_id}`]} onClick={() => remove(r)}>Delete</button>
              </PersonCard>
            ))}
          </div>
        </Section>
      )}

      <Section title="People you may know">
        {suggestions.length === 0 ? (
          <div className="friends-empty"><IconUsers /> No one to suggest right now.</div>
        ) : (
          <div className="friend-grid">
            {suggestions.map((p) => (
              <PersonCard key={p.id} person={p}>
                {p.requested ? (
                  <button type="button" className="fb-btn secondary block" disabled={busy[`p${p.id}`]} onClick={() => cancel(p)}>
                    {busy[`p${p.id}`] ? 'Cancelling…' : 'Cancel request'}
                  </button>
                ) : (
                  <button type="button" className="fb-btn primary block" disabled={busy[`p${p.id}`]} onClick={() => add(p)}>
                    <IconUserPlus /> {busy[`p${p.id}`] ? 'Sending…' : 'Add friend'}
                  </button>
                )}
              </PersonCard>
            ))}
          </div>
        )}
      </Section>

      <Section title="Your friends" count={friends.length}>
        {friends.length === 0 ? (
          <div className="friends-empty"><IconUserCheck /> Your friends will show up here.</div>
        ) : (
          <div className="friend-grid">
            {friends.map((f) => (
              <PersonCard key={f.friendship_id} person={f}>
                <button type="button" className="fb-btn secondary block" disabled={busy[`f${f.friendship_id}`]} onClick={() => setUnfriendTarget(f)}>
                  Unfriend
                </button>
              </PersonCard>
            ))}
          </div>
        )}
      </Section>

      {unfriendTarget && (
        <div className="confirm-overlay" onClick={() => setUnfriendTarget(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>Remove {unfriendTarget.name}?</h3>
            <p>You will no longer be friends. You can send a new request later.</p>
            <div className="confirm-actions">
              <button type="button" className="ghost" onClick={() => setUnfriendTarget(null)}>Cancel</button>
              <button type="button" className="danger" onClick={unfriend}>Unfriend</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}