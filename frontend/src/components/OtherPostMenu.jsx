import React, { useEffect, useRef, useState } from 'react';

/* small icon helper — color comes from the parent's `color` */
const Ico = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

const IPlus = () => (
  <Ico>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </Ico>
);
const IMinus = () => (
  <Ico>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M7 12h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </Ico>
);
const IBookmark = () => (
  <Ico><path fill="currentColor" d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" /></Ico>
);
const IReport = () => (
  <Ico>
    <path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-5l-4 3.5V18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M12 7v5M12 14.3v.1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </Ico>
);
const IShield = () => (
  <Ico>
    <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5Z" />
    <path fill="#fff" d="m12 7.5 1.4 2.9 3.1.4-2.3 2.1.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.1 3.1-.4Z" />
  </Ico>
);
const IChevron = () => (<Ico><path d="m9 5 7 7-7 7" {...stroke} /></Ico>);
const IBack = () => (<Ico><path d="M20 12H5m6-6-6 6 6 6" {...stroke} /></Ico>);
const IClose = () => (<Ico><path d="m6 6 12 12M18 6 6 18" {...stroke} strokeWidth="2.2" /></Ico>);
const IEdit = () => (
  <Ico><path fill="currentColor" d="M4 17.3V20h2.7L17.8 8.9l-2.7-2.7ZM19.7 7a.9.9 0 0 0 0-1.3l-1.4-1.4a.9.9 0 0 0-1.3 0l-1.1 1.1 2.7 2.7Z" /></Ico>
);
const IBell = () => (
  <Ico><path fill="currentColor" d="M12 22a2.3 2.3 0 0 0 2.3-2.3H9.7A2.3 2.3 0 0 0 12 22Zm7-6.3V11a7 7 0 0 0-5.2-6.8v-.7a1.8 1.8 0 0 0-3.6 0v.7A7 7 0 0 0 5 11v4.7l-2 2v1h18v-1Z" /></Ico>
);
const IInfo = () => (
  <Ico>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M12 11v6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="12" cy="7.6" r="1.3" fill="#fff" />
  </Ico>
);
const IUnfollow = () => (
  <Ico>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
    <path d="m9 11 6 6m0-6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </Ico>
);
const IClock = () => (
  <Ico>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M12 7v5.2l3.4 2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Ico>
);
const IUndo = () => (<Ico><path d="M9 5 4 10l5 5M4 10h10a5 5 0 0 1 0 10h-2" {...stroke} /></Ico>);

/* ---------- ••• menu + X button for other people's posts ---------- */
export default function OtherPostMenu({ onHide }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('main');
  const [saved, setSaved] = useState(false);
  const ref = useRef(null);

  const close = () => { setOpen(false); setView('main'); };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="opm-actions">
      <div className="post-menu" ref={ref}>
        <button
          type="button"
          className="post-menu-btn"
          aria-label="Post options"
          aria-expanded={open}
          onClick={() => (open ? close() : setOpen(true))}
        >
          &#8226;&#8226;&#8226;
        </button>

        {open && view === 'main' && (
          <div className="opm-list">
            <button type="button" className="opm-item" onClick={close}><IPlus /><span>Interested</span></button>
            <button type="button" className="opm-item" onClick={() => { close(); onHide(); }}><IMinus /><span>Not interested</span></button>
            <hr className="opm-sep" />
            <button type="button" className="opm-item" onClick={() => { setSaved((s) => !s); close(); }}>
              <IBookmark /><span>{saved ? 'Unsave post' : 'Save post'}</span>
            </button>
            <button type="button" className="opm-item" onClick={close}><IReport /><span>Report post</span></button>
            <button type="button" className="opm-item" onClick={close}><IShield /><span>Report post to group admins</span></button>
            <hr className="opm-sep" />
            <button type="button" className="opm-item opm-more" onClick={() => setView('more')}>
              <span>More options</span><IChevron />
            </button>
          </div>
        )}

        {open && view === 'more' && (
          <div className="opm-list">
            <div className="opm-title">
              <button type="button" className="opm-back" aria-label="Back" onClick={() => setView('main')}><IBack /></button>
              <span>More options</span>
            </div>
            <hr className="opm-sep" />
            <button type="button" className="opm-item" onClick={close}><IEdit /><span>View edit history</span></button>
            <button type="button" className="opm-item" onClick={close}><IBell /><span>Turn on notifications for this post</span></button>
            <button type="button" className="opm-item" onClick={close}><IInfo /><span>Why am I seeing this post?</span></button>
          </div>
        )}
      </div>

      <button type="button" className="post-menu-btn opm-x" aria-label="Hide post" title="Hide post" onClick={onHide}>
        <IClose />
      </button>
    </div>
  );
}

/* ---------- what replaces the post after pressing X ---------- */
const REASONS = ["Doesn't match my interests", 'Disturbing', 'Made me uncomfortable', "I don't like the creator", 'Other'];

export function HiddenPost({ name, onUndo }) {
  const [reason, setReason] = useState('');
  const [done, setDone] = useState({});
  const mark = (k) => setDone((d) => ({ ...d, [k]: true }));

  return (
    <div className="post-card hidden-post">
      <h3 className="hp-title">Why aren&apos;t you interested?</h3>
      <div className="hp-chips">
        {REASONS.map((r) => (
          <button key={r} type="button" className={`hp-chip${reason === r ? ' on' : ''}`} onClick={() => setReason(r)}>{r}</button>
        ))}
      </div>

      <h3 className="hp-title">Other steps you can take</h3>
      <ul className="hp-steps">
        <li>
          <button type="button" disabled={done.unfollow} onClick={() => mark('unfollow')}>
            <IUnfollow /><span>{done.unfollow ? `You unfollowed ${name}` : `Unfollow ${name}`}</span>
          </button>
        </li>
        <li>
          <button type="button" disabled={done.snooze} onClick={() => mark('snooze')}>
            <IClock /><span>{done.snooze ? `${name} snoozed for 30 days` : `Snooze ${name} for 30 days`}</span>
          </button>
        </li>
        <li>
          <button type="button" disabled={done.report} onClick={() => mark('report')}>
            <IReport /><span>{done.report ? 'Thanks for reporting this post' : 'Report post'}</span>
          </button>
        </li>
        <li>
          <button type="button" onClick={onUndo}><IUndo /><span>Unhide post</span></button>
        </li>
      </ul>
    </div>
  );
}