import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { avatarOf } from '../utils/people';
import EmojiPicker from './EmojiPicker';
import '../styles/sharemodal.css';

// 'light' matches the rest of the app. Change to 'dark' for the dark look.
const THEME = 'light';

const PICKER_W = 326;
const PICKER_H = 400;

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };

const IcClose = () => <svg {...svg}><path d="M6 6l12 12M18 6L6 18" /></svg>;
const IcSmile = () => <svg {...svg}><circle cx="12" cy="12" r="9" /><path d="M8.5 14c.9 1.4 2.1 2 3.5 2s2.6-.6 3.5-2" /><path d="M9 9.8h.01M15 9.8h.01" strokeWidth="2.6" /></svg>;
const IcChevR = () => <svg {...svg}><path d="M9 6l6 6-6 6" /></svg>;
const IcBack = () => <svg {...svg}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
const IcChevL = () => <svg {...svg}><path d="M15 6l-6 6 6 6" /></svg>;
const IcCaret = () => <svg viewBox="0 0 24 24" width="12" height="12"><path d="M7 10l5 5 5-5z" fill="currentColor" /></svg>;
const IcFeed = () => <svg {...svg}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M4 10h16" /></svg>;
const IcFriends = () => <svg {...svg}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><circle cx="17" cy="9" r="2.3" /><path d="M16.5 14.6c2.6 0 4.5 1.7 4.5 4.4" /></svg>;
const IcMessenger = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.4 2 2 6.2 2 11.5c0 2.9 1.3 5.4 3.4 7.1V22l3.1-1.7c1 .3 2.2.4 3.5.4 5.6 0 10-4.2 10-9.5S17.6 2 12 2zm1 12.7-2.5-2.6-4.9 2.7 5.4-5.7 2.6 2.6 4.8-2.7-5.4 5.7z" /></svg>;
const IcWhatsApp = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.200zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.500-.7-2.500-1.300-3.500-2.900-.3-.4.3-.4.8-1.400.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.300-.8.800-1 1.700-.9 2.600.3 1.200 1 2.300 2.100 3.300 1.700 1.500 3 2 4.300 2.300.8.200 1.600.1 2.100-.3.400-.4.700-.9.800-1.400.1-.300.1-.500 0-.600z" /></svg>;
const IcStory = () => <svg {...svg}><path d="M3.5 5.5C6 4 9 4.2 12 6c3-1.800 6-2 8.500-.5v13c-2.500-1.500-5.500-1.300-8.500.5-3-1.800-6-2-8.500-.5z" /><path d="M12 6v13" /></svg>;
const IcLink = () => <svg {...svg}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.700l1-1" /></svg>;
const IcGroup = () => <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="3.200" /><circle cx="5.500" cy="9.500" r="2.400" /><circle cx="18.500" cy="9.500" r="2.400" /><path d="M12 13c-3.300 0-6 1.800-6 4.500V19h12v-1.500c0-2.700-2.700-4.500-6-4.500zM5.500 13.500C3.500 13.600 2 15 2 17v2h3v-1.500c0-1.700.6-3 1.700-4-.4-.1-.8-.1-1.200 0zm13 0c-.4 0-.8 0-1.200.1 1.100 1 1.700 2.300 1.700 4V19h3v-2c0-2-1.500-3.400-3.500-3.500z" /></svg>;
const IcFriendProfile = () => <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.500" /><path d="M9 13.500c-3.600 0-6.500 1.900-6.500 4.500V19h13v-1c0-2.600-2.900-4.500-6.500-4.500z" /><path d="M18 8v6M15 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const IcCheck = () => <svg {...svg}><path d="M5 12.500l4.500 4.500L19 7.500" /></svg>;

const firstName = (n) => (n || '').split(' ')[0];

export default function ShareModal({ post, user, conversations = [], sharing, onShare, onShareStory, onSent, onClose }) {
  const [text, setText] = useState('');
  const [emojiPos, setEmojiPos] = useState(null);
  const [view, setView] = useState('main');   // 'main' | 'msgr' (the "Send in Messenger" step)
  const [selected, setSelected] = useState([]); // friend ids picked in Messenger
  const [msgText, setMsgText] = useState('');
  const [sendBusy, setSendBusy] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState('');
  const [storying, setStorying] = useState(false);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const taRef = useRef(null);
  const popRef = useRef(null);
  const rowRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const sharingRef = useRef(sharing);
  sharingRef.current = sharing;
  const emojiOpenRef = useRef(false);
  emojiOpenRef.current = emojiPos !== null;

  const myName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';
  const authorName = post?.user?.name || 'this post';
  const snippet = (post?.body || (post?.media_url ? 'a photo or video' : '')).slice(0, 140);
  const shareLine = `${authorName} posted: ${snippet}`.trim();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (emojiOpenRef.current) setEmojiPos(null);
      else if (!sharingRef.current) closeRef.current();
    };
    const onDown = (e) => {
      if (!emojiOpenRef.current) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.sm-emoji-trigger')) return;
      setEmojiPos(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (taRef.current) taRef.current.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.body.style.overflow = prev;
    };
  }, []);

  // arrows on the friends row
  const updateArrows = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => { updateArrows(); }, [conversations.length, view]);
  const scrollRow = (dir) => {
    if (rowRef.current) rowRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const toggleEmoji = (e) => {
    if (emojiPos) { setEmojiPos(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.right - PICKER_W, window.innerWidth - PICKER_W - 8));
    const below = r.bottom + 6;
    const top = below + PICKER_H > window.innerHeight - 8 ? Math.max(8, r.top - 6 - PICKER_H) : below;
    setEmojiPos({ top, left });
  };

  const insertEmoji = (ch) => {
    const ta = taRef.current;
    if (!ta) { setText((t) => `${t}${ch}`); return; }
    const s = ta.selectionStart == null ? text.length : ta.selectionStart;
    const e = ta.selectionEnd == null ? text.length : ta.selectionEnd;
    setText(`${text.slice(0, s)}${ch}${text.slice(e)}`);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + ch.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const openMessenger = (firstId) => {
    setEmojiPos(null);
    setSendErr('');
    setSelected(firstId == null ? [] : [firstId]);
    setView('msgr');
  };

  // main view: clicking a friend goes to the next step; messenger view: toggles the friend
  const pickFriend = (peer) => {
    if (view === 'main') { openMessenger(peer.id); return; }
    setSendErr('');
    setSelected((sel) => (sel.includes(peer.id) ? sel.filter((i) => i !== peer.id) : [...sel, peer.id]));
  };

  const sendAll = async () => {
    if (!selected.length || sendBusy) return;
    setSendBusy(true);
    setSendErr('');
    const body = msgText.trim();
    const failed = [];
    for (const id of selected) {
      try {
        await api.post(`/chat/${id}`, { body, shared_post_id: post.id });
      } catch (e) {
        failed.push(id);
      }
    }
    setSendBusy(false);
    if (onSent) onSent();
    if (failed.length === 0) { onClose(); return; }
    setSelected(failed);
    setSendErr('Could not send to everyone. Try again.');
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (e) {
      const t = document.createElement('textarea');
      t.value = link; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (err) { /* ignore */ }
      document.body.removeChild(t);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const openWhatsApp = () => {
    const msg = `${shareLine} ${window.location.origin}/?post=${post.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const shareStory = async () => {
    if (storying || sharing) return;
    setStorying(true);
    const ok = onShareStory ? await onShareStory() : false;
    if (!ok) {
      setStorying(false);
      setNote('Could not add this to your story. Try again.');
      setTimeout(() => setNote(''), 2500);
    }
  };

  const comingSoon = (what) => {
    setNote(`${what} isn’t available here yet.`);
    setTimeout(() => setNote(''), 2200);
  };

  const shareTo = [
    { key: 'messenger', label: 'Messenger', Icon: IcMessenger, onClick: () => openMessenger(null) },
    { key: 'whatsapp', label: 'WhatsApp', Icon: IcWhatsApp, onClick: openWhatsApp },
    { key: 'story', label: storying ? 'Adding…' : 'Your story', Icon: IcStory, onClick: shareStory },
    { key: 'link', label: copied ? 'Copied!' : 'Copy link', Icon: copied ? IcCheck : IcLink, onClick: copyLink },
    { key: 'group', label: 'Group', Icon: IcGroup, onClick: () => comingSoon('Sharing to a group') },
    { key: 'fprofile', label: 'Friend’s profile', Icon: IcFriendProfile, onClick: () => comingSoon('Sharing to a friend’s profile') },
  ];

  const friendsRow = () => (
    <div className="sm-row-wrap">
      {canL && <button type="button" className="sm-arrow l" aria-label="Previous" onClick={() => scrollRow(-1)}><IcChevL /></button>}
      <div className="sm-row" ref={rowRef} onScroll={updateArrows}>
        {conversations.map((c) => {
          const on = selected.includes(c.user.id);
          return (
            <button type="button" key={c.user.id} className="sm-friend" onClick={() => pickFriend(c.user)}>
              <span className="sm-av">
                <img src={avatarOf(c.user)} alt={c.user.name} />
                {c.online && !on && <i className="sm-on" />}
                {on && <i className="sm-sel"><IcCheck /></i>}
              </span>
              <span className="sm-fname">{c.user.name}</span>
            </button>
          );
        })}
      </div>
      {canR && <button type="button" className="sm-arrow r" aria-label="Next" onClick={() => scrollRow(1)}><IcChevR /></button>}
    </div>
  );

  return createPortal(
    <div
      className={`sm-overlay sm-${THEME}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !sharing) onClose(); }}
    >
      <div className="sm-box" role="dialog" aria-modal="true" aria-label="Share">
        <div className="sm-head">
          {view === 'msgr' && (
            <button type="button" className="sm-x sm-back" aria-label="Back" onClick={() => { setView('main'); setSendErr(''); }} disabled={sendBusy}><IcBack /></button>
          )}
          <h2>{view === 'msgr' ? 'Send in Messenger' : 'Share'}</h2>
          <button type="button" className="sm-x" aria-label="Close" onClick={onClose} disabled={sharing || sendBusy}><IcClose /></button>
        </div>

        {view === 'msgr' ? (
          <div className="sm-scroll">
            <div className="sm-section sm-step2">
              {conversations.length === 0
                ? <div className="sm-empty">Add friends to send this in Messenger.</div>
                : friendsRow()}
              <input
                className="sm-msg"
                maxLength={900}
                placeholder="Add an optional message here…"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendAll(); } }}
                autoFocus
              />
              {sendErr && <div className="sm-note sm-err">{sendErr}</div>}
              <button type="button" className="sm-send" disabled={!selected.length || sendBusy} onClick={sendAll}>
                <IcMessenger />{sendBusy ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        ) : (

        <div className="sm-scroll">
          <div className="sm-compose">
            <div className="sm-user">
              <img src={avatarOf(user)} alt={myName} />
              <div>
                <div className="sm-name">{myName}</div>
                <div className="sm-chips">
                  <span className="sm-chip"><IcFeed />Feed</span>
                  <span className="sm-chip"><IcFriends />Friends<IcCaret /></span>
                </div>
              </div>
            </div>

            <div className="sm-input-wrap">
              <textarea
                ref={taRef}
                className="sm-input"
                maxLength={2000}
                placeholder="Say something about this…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="button" className="sm-emoji sm-emoji-trigger" aria-label="Emoji" onClick={toggleEmoji}><IcSmile /></button>
            </div>

            <div className="sm-actions">
              <button type="button" className="sm-now" disabled={sharing} onClick={() => onShare(text.trim())}>
                {sharing ? 'Sharing…' : 'Share now'}
              </button>
            </div>
          </div>

          <div className="sm-section sm-msgr">
            <h3>Send in Messenger</h3>
            {conversations.length === 0
              ? <div className="sm-empty">Add friends to send this in Messenger.</div>
              : friendsRow()}
          </div>

          <div className="sm-section">
            <h3>Share to</h3>
            <div className="sm-row sm-shareto">
              {shareTo.map(({ key, label, Icon, onClick }) => (
                <button type="button" key={key} className="sm-opt" onClick={onClick}>
                  <span className="sm-circle"><Icon /></span>
                  <span className="sm-olabel">{label}</span>
                </button>
              ))}
            </div>
            {note && <div className="sm-note">{note}</div>}
          </div>
        </div>
        )}
      </div>

      {emojiPos && view === 'main' && (
        <div className="sm-emoji-pop" ref={popRef} style={{ top: emojiPos.top, left: emojiPos.left }}>
          <EmojiPicker onPick={(ch) => insertEmoji(ch)} />
        </div>
      )}
    </div>,
    document.body,
  );
}