import React, { useEffect, useRef, useState } from 'react';
import { IconBell, IconUserPlus, IconUserCheck } from './Icons';
import { avatarOf, timeAgo } from '../utils/people';

function NotifRow({ n, busy, onOpen, onAccept, onDecline }) {
  const pending = n.type === 'friend_request' && n.friendship && n.friendship.status === 'pending';
  const accepted = n.type === 'friend_request' && n.friendship && n.friendship.status === 'accepted';

  return (
    <div className={`notif-row ${n.read ? '' : 'unread'}`} onClick={() => onOpen(n)}>
      <span className="notif-avatar">
        <img src={avatarOf(n.actor, 96)} alt="" />
        <i className={`notif-type ${n.type}`}>
          {n.type === 'friend_request' ? <IconUserPlus /> : <IconUserCheck />}
        </i>
      </span>

      <div className="notif-content">
        <div className="notif-text">
          <b>{n.actor.name}</b>{' '}
          {n.type === 'friend_request' ? 'sent you a friend request.' : 'accepted your friend request.'}
        </div>
        <div className={`notif-time ${n.read ? '' : 'new'}`}>{timeAgo(n.created_at)}</div>

        {pending && (
          <div className="notif-actions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="fb-btn primary" disabled={busy} onClick={() => onAccept(n)}>Confirm</button>
            <button type="button" className="fb-btn secondary" disabled={busy} onClick={() => onDecline(n)}>Delete</button>
          </div>
        )}
        {accepted && <div className="notif-done">You are now friends.</div>}
      </div>

      {!n.read && <span className="notif-dot" aria-label="Unread" />}
    </div>
  );
}

export function NotificationToast({ toast, onClose, onOpen }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className="notif-toast" role="status" onClick={() => { onOpen(toast); onClose(); }}>
      <span className="notif-avatar">
        <img src={avatarOf(toast.actor, 96)} alt="" />
        <i className={`notif-type ${toast.type}`}>
          {toast.type === 'friend_request' ? <IconUserPlus /> : <IconUserCheck />}
        </i>
      </span>
      <div className="notif-content">
        <div className="notif-text">
          <b>{toast.actor.name}</b>{' '}
          {toast.type === 'friend_request' ? 'sent you a friend request.' : 'accepted your friend request.'}
        </div>
        <div className="notif-time new">Just now</div>
      </div>
      <button type="button" className="notif-toast-x" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); onClose(); }}>&times;</button>
    </div>
  );
}

export default function NotificationBell({ notifs, onOpenFriends }) {
  const { items, unread, markRead, markAllRead, accept, decline } = notifs;
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const shown = filter === 'unread' ? items.filter((n) => !n.read) : items;

  const openItem = (n) => {
    if (!n.read) markRead(n.id);
    setOpen(false);
    onOpenFriends();
  };

  const run = async (n, fn) => {
    setBusyId(n.id);
    try { await fn(n.friendship.id); } finally { setBusyId(null); }
  };

  return (
    <div className="nav-notif" ref={wrapRef}>
      <button
        type="button"
        title="Notifications"
        className={`nav-circle ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <IconBell />
        {unread > 0 && <span className="nav-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <h3>Notifications</h3>
            {unread > 0 && (
              <button type="button" className="notif-link" onClick={markAllRead}>Mark all as read</button>
            )}
          </div>
          <div className="notif-filters">
            <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All</button>
            <button type="button" className={filter === 'unread' ? 'on' : ''} onClick={() => setFilter('unread')}>Unread</button>
          </div>

          <div className="notif-list">
            {shown.length === 0 && (
              <div className="notif-empty">
                {filter === 'unread' ? 'No unread notifications.' : 'You have no notifications yet.'}
              </div>
            )}
            {shown.map((n) => (
              <NotifRow
                key={n.id}
                n={n}
                busy={busyId === n.id}
                onOpen={openItem}
                onAccept={(x) => run(x, accept)}
                onDecline={(x) => run(x, decline)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}