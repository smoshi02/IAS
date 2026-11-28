import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Emoji, EmojiStyle } from 'emoji-picker-react';
import emojiData from 'emoji-picker-react/data/emojis-en';
import api from '../api/axios';
import { IconSearch } from './Icons';
import { avatarOf, timeAgo } from '../utils/people';
import PostModal from './PostModal';
import '../styles/msgshare.css';

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */
const REACTION_SET = ['👍', '❤️', '😆', '😮', '😢', '😡'];
const THEMES = ['#5b4cf5', '#0084ff', '#a033ff', '#ff5ca1', '#f7b125', '#31a24c', '#fa3e3e', '#00a6a6'];
const STICKERS = [
  '😂', '🥰', '😍', '😭', '😎', '🤩', '🥳', '😴',
  '🤔', '🙄', '😡', '😱', '👍', '🙏', '👏', '🔥',
  '💯', '❤️', '💔', '🎉', '😘', '🤗', '😅', '🤣',
  '😇', '😜', '🥺', '😢',
];
const GAP = 30 * 60 * 1000;

const first = (name) => (name || '').split(' ')[0];
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Turns any emoji inside a text into the Facebook-style emoji image
const EMOJI_RE = /((?:\p{Regional_Indicator}{2})|(?:\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*))/gu;

function FbText({ text, size = 20 }) {
  if (!text) return null;
  const parts = String(text).split(EMOJI_RE);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? (
        <span className="fbe" key={i}>
          <Emoji
            unified={Array.from(p).map((c) => c.codePointAt(0).toString(16)).join('-')}
            size={size}
            emojiStyle={EmojiStyle.FACEBOOK}
          />
        </span>
      ) : p))}
    </>
  );
}

// how many emojis a message has, if it is ONLY emojis (otherwise 0)
function emojiCount(text) {
  const t = (text || '').trim();
  if (!t) return 0;
  const parts = t.split(EMOJI_RE);
  const rest = parts.filter((_, i) => i % 2 === 0).join('').trim();
  if (rest) return 0;
  return parts.filter((_, i) => i % 2 === 1).length;
}

function activeText(online, lastSeen) {
  if (online) return 'Active now';
  if (!lastSeen) return 'Offline';
  const t = timeAgo(lastSeen);
  return t === 'Just now' ? 'Active just now' : `Active ${t} ago`;
}

function sentText(iso) {
  const t = timeAgo(iso);
  return t === 'Just now' ? 'Sent' : `Sent ${t} ago`;
}

// a shared post inside a chat: photo on top, text + author underneath
function PostCard({ shared, onLoad }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mm-post" role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={(e) => { if (e.key === 'Enter') setOpen(true); }}>
        {shared.media_url && (shared.media_type === 'video'
          ? <video src={shared.media_url} preload="metadata" muted onLoadedMetadata={onLoad} />
          : <img src={shared.media_url} alt="" onLoad={onLoad} />)}
        <div className="mm-post-body">
          {shared.body && <div className="mm-post-title"><FbText text={shared.body} size={16} /></div>}
          <div className="mm-post-src">
            <img src={avatarOf(shared.user, 32)} alt="" />
            <span>{shared.user.name}</span>
          </div>
        </div>
      </div>
      {open && <PostModal postId={shared.id} onClose={() => setOpen(false)} />}
    </>
  );
}

function previewOf(c) {
  const l = c.last;
  if (!l) return 'Say hi 👋';
  const who = l.mine ? 'You' : first(c.user.name);
  if (l.unsent) return l.mine ? 'You unsent a message' : `${who} unsent a message`;
  if (l.audio) return `${who} sent a voice message`;
  if (l.sticker) return `${who} sent a sticker`;
  if (l.shared && !l.body) return `${who} sent a post`;
  if (l.media_type && !l.body) return `${who} sent a ${l.media_type === 'video' ? 'video' : 'photo'}`;
  return `${l.mine ? 'You: ' : ''}${l.body}`;
}

function stamp(iso) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return time;
  if ((now - d) / 86400000 < 7) return `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`;
  const date = d.toLocaleDateString([], {
    month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
  return `${date}, ${time}`;
}

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Ico = {
  Smile: (p) => <svg {...svg} {...p}><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9.5h.01M15 9.5h.01" /></svg>,
  Reply: (p) => <svg {...svg} {...p}><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v3" /></svg>,
  Forward: (p) => <svg {...svg} {...p}><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 0 0-6 6v3" /></svg>,
  Dots: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="12" cy="5" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="12" cy="19" r="1.9" /></svg>,
  Image: (p) => <svg {...svg} {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-9 9" /></svg>,
  Trash: (p) => <svg {...svg} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>,
  Copy: (p) => <svg {...svg} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>,
  Close: (p) => <svg {...svg} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  Minus: (p) => <svg {...svg} {...p}><path d="M5 12h14" /></svg>,
  Chev: (p) => <svg {...svg} {...p}><path d="M6 9l6 6 6-6" /></svg>,
  Mic: (p) => <svg {...svg} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>,
  Sticker: (p) => <svg {...svg} {...p}><path d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5l-7 7H8a4 4 0 0 1-4-4V8z" /><path d="M20 13h-4a2 2 0 0 0-2 2v5" /><path d="M9 9.5h.01M14 9.5h.01" /></svg>,
  Play: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 4.5v15l12-7.5z" /></svg>,
  Pause: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>,
  Send: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M2.5 20.5l19-8.5-19-8.5v6.6l13 1.9-13 1.9z" /></svg>,
  Like: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M2 21h4V9H2v12zM22 10c0-1.1-.9-2-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6C6.2 8 6 8.5 6 9v10c0 1.1.9 2 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7c.1-.2.2-.5.2-.8v-2z" /></svg>,
};

/* ------------------------------------------------------------------ */
/* Message box that shows emojis as Facebook-style images              */
/* ------------------------------------------------------------------ */
const fbEmojiUrl = (u) => `https://cdn.jsdelivr.net/npm/emoji-datasource-facebook/img/facebook/64/${u}.png`;
const toUnified = (ch) => Array.from(ch).map((c) => c.codePointAt(0).toString(16)).join('-');

function serializeBox(root) {
  let out = '';
  root.childNodes.forEach((n) => {
    if (n.nodeType === 3) out += n.nodeValue;
    else if (n.nodeName === 'IMG') out += n.getAttribute('alt') || '';
    else if (n.nodeName === 'BR') out += '';
    else out += serializeBox(n);
  });
  return out;
}

const EmojiInput = forwardRef(function EmojiInput({ value, onChange, placeholder }, ref) {
  const box = useRef(null);

  const emit = () => {
    const el = box.current;
    if (!el) return;
    const text = serializeBox(el);
    if (!text && el.innerHTML) el.innerHTML = ''; // drop stray <br> so the placeholder shows again
    onChange(text);
  };

  const putNode = (node) => {
    const el = box.current;
    el.focus();
    const sel = window.getSelection();
    let range;
    if (sel.rangeCount && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      range = sel.getRangeAt(0);
      range.deleteContents();
    } else {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
    }
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    emit();
  };

  useImperativeHandle(ref, () => ({
    focus: () => { if (box.current) box.current.focus(); },
    insertEmoji: (ch, unified) => {
      const img = document.createElement('img');
      img.src = fbEmojiUrl(unified || toUnified(ch));
      img.alt = ch;
      img.draggable = false;
      img.className = 'cw-rte-emoji';
      putNode(img);
    },
  }));

  // the parent cleared the draft (message sent) -> clear the box
  useEffect(() => {
    if (value === '' && box.current && box.current.innerHTML) box.current.innerHTML = '';
  }, [value]);

  useEffect(() => { if (box.current) box.current.focus(); }, []);

  return (
    <div
      ref={box}
      className="cw-rte"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      data-placeholder={placeholder}
      onInput={emit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const form = box.current.closest('form');
          if (form && form.requestSubmit) form.requestSubmit();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const t = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, t.replace(/\r?\n/g, ' '));
      }}
    />
  );
});

/* ------------------------------------------------------------------ */
/* Messenger-style emoji picker (search on top, "Recently Used",       */
/* 8-per-row grid, category tabs at the bottom)                        */
/* ------------------------------------------------------------------ */
const EMOJI_CATS = [
  { id: 'smileys_people', label: 'Smileys & People', icon: 'smile' },
  { id: 'animals_nature', label: 'Animals & Nature', icon: 'paw' },
  { id: 'food_drink', label: 'Food & Drink', icon: 'apple' },
  { id: 'activities', label: 'Activities', icon: 'ball' },
  { id: 'travel_places', label: 'Travel & Places', icon: 'beach' },
  { id: 'objects', label: 'Objects', icon: 'bulb' },
  { id: 'symbols', label: 'Symbols', icon: 'at' },
  { id: 'flags', label: 'Flags', icon: 'flag' },
];
const RECENT_KEY = 'msgr-recent-emojis';
const RECENT_MAX = 8;
const RECENT_DEFAULT = ['1f62d', '1f614', '2705', '2714-fe0f', '274c', '1f612', '1f979', '1f618'];

const unifiedToChar = (u) => String.fromCodePoint(...u.split('-').map((h) => parseInt(h, 16)));

const catSvg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const CatIcon = ({ name }) => {
  switch (name) {
    case 'smile': return <svg {...catSvg}><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9.5h.01M15 9.5h.01" /></svg>;
    case 'paw': return <svg {...catSvg}><circle cx="6" cy="11" r="1.8" /><circle cx="10" cy="6.5" r="1.8" /><circle cx="14" cy="6.5" r="1.8" /><circle cx="18" cy="11" r="1.8" /><path d="M12 12c-3 0-5 3-5 5 0 1.8 1.6 2.5 3 2.2 1-.2 1.4-.5 2-.5s1 .3 2 .5c1.4.3 3-.4 3-2.2 0-2-2-5-5-5z" /></svg>;
    case 'apple': return <svg {...catSvg}><path d="M12 8c-1.5-1.2-5-1.5-6 1.5-1 3 .5 8 3 10 1.3 1 2.2.5 3 .5s1.7.5 3-.5c2.5-2 4-7 3-10-1-3-4.5-2.7-6-1.5z" /><path d="M12 8c0-2 1-3.5 3-4" /></svg>;
    case 'ball': return <svg {...catSvg}><circle cx="12" cy="12" r="9" /><path d="M12 8l3.5 2.5-1.3 4h-4.4l-1.3-4z" /><path d="M12 8V3M15.5 10.5l4.5-1.5M14.2 14.5l3 3.8M9.8 14.5l-3 3.8M8.5 10.5L4 9" /></svg>;
    case 'beach': return <svg {...catSvg}><path d="M3 12a9 8 0 0 1 18 0z" /><path d="M12 12v9" /><path d="M4 21h16" /></svg>;
    case 'bulb': return <svg {...catSvg}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>;
    case 'at': return <svg {...catSvg}><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></svg>;
    case 'flag': return <svg {...catSvg}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>;
    default: return null;
  }
};

function loadRecent() {
  try {
    const r = JSON.parse(localStorage.getItem(RECENT_KEY) || 'null');
    if (Array.isArray(r) && r.length) return r.slice(0, RECENT_MAX);
  } catch (e) { /* ignore */ }
  return RECENT_DEFAULT;
}

const EmojiCell = React.memo(function EmojiCell({ u, onPick }) {
  return (
    <button type="button" className="ep-emoji" onClick={() => onPick(u)}>
      <Emoji unified={u} size={32} emojiStyle={EmojiStyle.FACEBOOK} lazyLoad />
    </button>
  );
});

function EmojiPanel({ onPick }) {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState(loadRecent);
  const [active, setActive] = useState(EMOJI_CATS[0].id);
  const bodyRef = useRef(null);
  const secRefs = useRef({});

  const pick = (u) => {
    onPick(unifiedToChar(u), u);
    setRecent((r) => {
      const next = [u, ...r.filter((x) => x !== u)].slice(0, RECENT_MAX);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
      return next;
    });
  };

  const term = q.trim().toLowerCase();
  const results = term
    ? EMOJI_CATS.flatMap((c) => (emojiData.emojis[c.id] || [])
      .filter((e) => e.n.some((n) => n.toLowerCase().includes(term))))
      .slice(0, 160)
    : [];

  const goTo = (id) => {
    setActive(id);
    const el = secRefs.current[id];
    if (el && bodyRef.current) bodyRef.current.scrollTop = el.offsetTop - bodyRef.current.offsetTop;
  };

  // highlight the tab of the section that is currently in view
  const onScroll = () => {
    const b = bodyRef.current;
    if (!b || term) return;
    let cur = EMOJI_CATS[0].id;
    EMOJI_CATS.forEach((c) => {
      const el = secRefs.current[c.id];
      if (el && el.offsetTop - b.offsetTop <= b.scrollTop + 24) cur = c.id;
    });
    if (cur !== active) setActive(cur);
  };

  return (
    <div className="ep">
      <div className="ep-search">
        <IconSearch />
        <input placeholder="Search emoji" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="ep-body" ref={bodyRef} onScroll={onScroll}>
        {term ? (
          <>
            <div className="ep-label">Search results</div>
            {results.length === 0 && <div className="ep-none">No emoji found</div>}
            <div className="ep-grid">{results.map((e) => <EmojiCell key={e.u} u={e.u} onPick={pick} />)}</div>
          </>
        ) : (
          <>
            <div className="ep-label">Recently Used</div>
            <div className="ep-grid">{recent.map((u) => <EmojiCell key={`r${u}`} u={u} onPick={pick} />)}</div>
            {EMOJI_CATS.map((c) => (
              <div key={c.id} ref={(el) => { secRefs.current[c.id] = el; }}>
                <div className="ep-label">{c.label}</div>
                <div className="ep-grid">
                  {(emojiData.emojis[c.id] || []).map((e) => <EmojiCell key={e.u} u={e.u} onPick={pick} />)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="ep-tabs">
        {EMOJI_CATS.map((c) => (
          <button
            type="button"
            key={c.id}
            title={c.label}
            className={!term && active === c.id ? 'on' : ''}
            onClick={() => { setQ(''); setTimeout(() => goTo(c.id), 0); }}
          ><CatIcon name={c.icon} /></button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chats panel (opens from the messenger bubble in the navbar)         */
/* ------------------------------------------------------------------ */
export function ChatsPanel({ conversations, onOpen }) {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');

  const list = conversations
    .filter((c) => (tab === 'unread' ? c.unread > 0 : true))
    .filter((c) => !q.trim() || c.user.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <div className="notif-panel-head"><h3>Chats</h3></div>
      <div className="msgr-search">
        <IconSearch />
        <input placeholder="Search Messenger" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="notif-filters">
        <button type="button" className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>All</button>
        <button type="button" className={tab === 'unread' ? 'on' : ''} onClick={() => setTab('unread')}>Unread</button>
      </div>
      <div className="notif-list">
        {conversations.length === 0 && <div className="notif-empty">Add friends to start chatting.</div>}
        {conversations.length > 0 && list.length === 0 && (
          <div className="notif-empty">{tab === 'unread' ? 'No unread chats.' : 'No chats found.'}</div>
        )}
        {list.map((c) => (
          <div key={c.user.id} className={`notif-row ${c.unread ? 'unread' : ''}`} onClick={() => onOpen(c.user)}>
            <span className="notif-avatar">
              <img src={avatarOf(c.user, 96)} alt="" />
              {c.online && <i className="presence-dot" />}
            </span>
            <div className="notif-content">
              <div className="notif-text"><b>{c.user.name}</b></div>
              <div className={`notif-time msgr-preview ${c.unread ? 'new' : ''}`}>
                <FbText text={previewOf(c)} size={14} />{c.last ? ` · ${timeAgo(c.last.created_at)}` : ''}
              </div>
            </div>
            {c.unread > 0 && <span className="notif-dot" aria-label="Unread" />}
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */
function RemoveModal({ m, onClose, onConfirm }) {
  const [mode, setMode] = useState(m.mine ? 'everyone' : 'me');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    await onConfirm(mode);
    setBusy(false);
  };

  return (
    <div className="mm-overlay" onClick={() => !busy && onClose()}>
      <div className="mm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Who do you want to remove this message for?</h3>
        <div className="mm-modal-body">
          {m.mine && (
            <label className="mm-radio">
              <input type="radio" name="rm" checked={mode === 'everyone'} onChange={() => setMode('everyone')} />
              <div>
                <strong>Unsend for everyone</strong>
                <small>This message will be removed for everyone in the chat. Others may have already seen it.</small>
              </div>
            </label>
          )}
          <label className="mm-radio">
            <input type="radio" name="rm" checked={mode === 'me'} onChange={() => setMode('me')} />
            <div>
              <strong>Remove for you</strong>
              <small>This removes the message from your chat, but the other person can still see it.</small>
            </div>
          </label>
        </div>
        <div className="mm-modal-actions">
          <button type="button" className="fb-btn secondary" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="button" className="fb-btn primary" disabled={busy} onClick={go}>
            {busy ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ForwardModal({ m, friends, onClose, onSend }) {
  const [q, setQ] = useState('');
  const [sent, setSent] = useState({});
  const [busy, setBusy] = useState({});

  const list = friends.filter((c) => !q.trim() || c.user.name.toLowerCase().includes(q.trim().toLowerCase()));

  const send = async (id) => {
    setBusy((b) => ({ ...b, [id]: true }));
    const ok = await onSend(id);
    setBusy((b) => ({ ...b, [id]: false }));
    if (ok) setSent((s) => ({ ...s, [id]: true }));
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Forward</h3>
        <div className="mm-modal-body">
          <div className="mm-fwd-preview">
            {m.audio_url && '🎤 Voice message'}
            {m.shared && !m.media_url && !m.body && '📰 Post'}
            {m.media_url && (m.media_type === 'video' ? '🎬 Video' : '🖼️ Photo')}
            {(m.media_url || m.audio_url) && m.body ? ' · ' : ''}<FbText text={m.body} size={16} />
          </div>
          <div className="msgr-search" style={{ margin: '10px 0' }}>
            <IconSearch />
            <input placeholder="Search friends" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="mm-fwd-list">
            {list.length === 0 && <div className="notif-empty">No friends found.</div>}
            {list.map((c) => (
              <div className="mm-fwd-row" key={c.user.id}>
                <img src={avatarOf(c.user, 80)} alt="" />
                <span>{c.user.name}</span>
                <button
                  type="button"
                  className={`fb-btn ${sent[c.user.id] ? 'secondary' : 'primary'}`}
                  disabled={busy[c.user.id] || sent[c.user.id]}
                  onClick={() => send(c.user.id)}
                >
                  {sent[c.user.id] ? 'Sent' : busy[c.user.id] ? 'Sending…' : 'Send'}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mm-modal-actions">
          <button type="button" className="fb-btn secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function Lightbox({ media, onClose }) {
  return (
    <div className="mm-lightbox" onClick={onClose}>
      <button type="button" className="mm-lightbox-x" onClick={onClose} aria-label="Close"><Ico.Close /></button>
      {media.type === 'video'
        ? <video src={media.url} controls autoPlay onClick={(e) => e.stopPropagation()} />
        : <img src={media.url} alt="" onClick={(e) => e.stopPropagation()} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Voice message player                                                */
/* ------------------------------------------------------------------ */
const WAVE = [6, 10, 16, 8, 14, 20, 12, 6, 18, 10, 14, 8, 16, 12, 6, 10, 18, 8, 14, 10];

function VoiceBubble({ url, seconds }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const total = seconds || 0;

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      a.pause();
    }
  };

  const filled = total ? Math.round((pos / total) * WAVE.length) : 0;

  return (
    <div className="mm-voice">
      <button type="button" className="mm-voice-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <Ico.Pause /> : <Ico.Play />}
      </button>
      <div className="mm-wave">
        {WAVE.map((h, i) => <i key={i} className={i < filled ? 'on' : ''} style={{ height: h }} />)}
      </div>
      <span className="mm-voice-time">{mmss(playing || pos ? pos : total)}</span>
      <audio
        ref={ref}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setPos(0); }}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One message (bubble + hover tools + reactions)                      */
/* ------------------------------------------------------------------ */
function MessageRow({
  m, peer, showAvatar, cont, more, status, onReply, onReact, onRemove, onForward, onMedia, onMediaLoad,
}) {
  const [pop, setPop] = useState(null); // 'react' | 'more' | null
  const ref = useRef(null);

  useEffect(() => {
    if (!pop) return undefined;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setPop(null); };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [pop]);

  const name = first(peer.name);
  const mineReaction = m.reactions.find((r) => r.mine);
  const grouped = {};
  m.reactions.forEach((r) => { grouped[r.type] = (grouped[r.type] || 0) + 1; });

  let replyNote = null;
  let quote = null;
  if (m.reply && !m.unsent) {
    if (m.mine) replyNote = m.reply.mine ? 'You replied to yourself' : `You replied to ${name}`;
    else replyNote = m.reply.mine ? `${name} replied to you` : `${name} replied to themself`;
    if (m.reply.unsent) quote = 'Message unsent';
    else if (m.reply.audio) quote = 'Voice message';
    else if (m.reply.media_type && !m.reply.body) quote = m.reply.media_type === 'video' ? 'Video' : 'Photo';
    else quote = m.reply.body;
  }

  // 1-3 emojis only: show them big, without a bubble (like Messenger)
  const emojiN = !m.unsent && !m.media_url && !m.sticker ? emojiCount(m.body) : 0;
  const bigEmoji = emojiN > 0 && emojiN <= 3;

  const tools = !m.unsent && (
    <div className={`mm-tools ${pop ? 'open' : ''}`}>
      <button type="button" title="React" onClick={() => setPop(pop === 'react' ? null : 'react')}><Ico.Smile /></button>
      <button type="button" title="Reply" onClick={() => onReply(m)}><Ico.Reply /></button>
      <button type="button" title="More" onClick={() => setPop(pop === 'more' ? null : 'more')}><Ico.Dots /></button>
    </div>
  );

  return (
    <div className={`mm-row ${m.mine ? 'mine' : 'theirs'} ${cont ? 'cont' : ''} ${more ? 'more' : ''}`} ref={ref}>
      {!m.mine && (
        <span className="mm-av">
          {showAvatar && <img src={avatarOf(peer, 56)} alt="" />}
        </span>
      )}

      <div className="mm-col">
        {m.forwarded && !m.unsent && <div className="mm-note"><Ico.Forward /> Forwarded</div>}
        {replyNote && (
          <>
            <div className="mm-note"><Ico.Reply /> {replyNote}</div>
            <div className="mm-quote"><FbText text={quote} size={16} /></div>
          </>
        )}

        <div className="mm-line">
          {m.mine && tools}

          <div className="mm-stack">
            {m.unsent && (
              <div className="mm-bubble unsent">{m.mine ? 'You unsent a message' : `${name} unsent a message`}</div>
            )}
            {m.audio_url && (
              <div className="mm-bubble voice"><VoiceBubble url={m.audio_url} seconds={m.audio_seconds} /></div>
            )}
            {m.media_url && (
              <div className="mm-media" onClick={() => onMedia({ url: m.media_url, type: m.media_type })}>
                {m.media_type === 'video'
                  ? <video src={m.media_url} preload="metadata" muted onLoadedMetadata={onMediaLoad} />
                  : <img src={m.media_url} alt="" onLoad={onMediaLoad} />}
              </div>
            )}
            {!m.unsent && m.sticker && m.body && (
              <div className="mm-sticker"><FbText text={m.body} size={84} /></div>
            )}
            {!m.unsent && !m.sticker && m.body && (bigEmoji
              ? <div className="mm-big"><FbText text={m.body} size={emojiN === 1 ? 44 : 32} /></div>
              : <div className="mm-bubble"><FbText text={m.body} /></div>)}
            {!m.unsent && m.shared && <PostCard shared={m.shared} onLoad={onMediaLoad} />}
          </div>

          {!m.mine && tools}
        </div>

        {m.reactions.length > 0 && (
          <button
            type="button"
            className="mm-react-pill"
            title={m.reactions.map((r) => (r.mine ? 'You' : r.name)).join(', ')}
            onClick={() => mineReaction && onReact(m, mineReaction.type)}
          >
            <FbText text={Object.keys(grouped).join('')} size={14} />
            {m.reactions.length > 1 && <span>{m.reactions.length}</span>}
          </button>
        )}

        {status && (status.seen
          ? <img className="mm-seen" src={avatarOf(peer, 32)} alt="Seen" title="Seen" />
          : <div className="mm-status">{status.text}</div>)}
      </div>

      {pop === 'react' && (
        <div className="mm-picker">
          {REACTION_SET.map((e) => (
            <button
              type="button"
              key={e}
              className={mineReaction && mineReaction.type === e ? 'on' : ''}
              onClick={() => { onReact(m, e); setPop(null); }}
            ><FbText text={e} size={26} /></button>
          ))}
        </div>
      )}

      {pop === 'more' && (
        <div className="mm-menu">
          <button type="button" onClick={() => { setPop(null); onForward(m); }}><Ico.Forward /> Forward</button>
          {m.body && (
            <button
              type="button"
              onClick={() => { setPop(null); if (navigator.clipboard) navigator.clipboard.writeText(m.body); }}
            ><Ico.Copy /> Copy</button>
          )}
          <button type="button" onClick={() => { setPop(null); onRemove(m); }}><Ico.Trash /> Remove</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One docked chat window                                              */
/* ------------------------------------------------------------------ */
function ChatWindow({ peer, conv, friends, onClose, onSeen, min, slot, onToggleMin }) {
  const [msgs, setMsgs] = useState([]);
  const [draft, setDraft] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [forwardTarget, setForwardTarget] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [rec, setRec] = useState(null); // null | { seconds }
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(`msgr-theme-${peer.id}`) || THEMES[0]; } catch (e) { return THEMES[0]; }
  });

  const bodyRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const sigRef = useRef('');
  const nearBottom = useRef(true);
  const lastShown = useRef(null);
  const previewRef = useRef(null);
  const recRef = useRef({ mr: null, chunks: [], stream: null, timer: null, start: 0, cancel: false });
  const sendVoiceRef = useRef(null);
  const seenRef = useRef(onSeen);
  useEffect(() => { seenRef.current = onSeen; }, [onSeen]);

  const pull = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/${peer.id}`);
      const sig = JSON.stringify(data.messages);
      if (sig !== sigRef.current) {
        sigRef.current = sig;
        setMsgs(data.messages);
      }
      setLoaded(true);
      if (seenRef.current) seenRef.current(); // server marked theirs as read -> clear badge
    } catch (e) {
      /* try again next tick */
    }
  }, [peer.id]);

  useEffect(() => {
    pull();
    const wake = () => { if (document.visibilityState === 'visible') pull(); };
    const id = setInterval(wake, 3000);
    return () => clearInterval(id);
  }, [pull]);

  // on close: free the photo preview and stop the microphone if it is still on
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const r = recRef.current;
    r.cancel = true;
    clearInterval(r.timer);
    try { if (r.mr && r.mr.state !== 'inactive') r.mr.stop(); } catch (e) { /* ignore */ }
    if (r.stream) r.stream.getTracks().forEach((t) => t.stop());
  }, []);

  // keep the view pinned to the newest message (only when you're near the bottom)
  const scrollDown = () => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };
  useEffect(() => {
    const last = msgs[msgs.length - 1];
    const id = last ? last.id : 0;
    if (lastShown.current !== id) {
      const initial = lastShown.current === null;
      lastShown.current = id;
      if (initial || nearBottom.current || (last && last.mine)) scrollDown();
    }
  }, [msgs, loaded]);

  const onScroll = () => {
    const el = bodyRef.current;
    if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
  };
  const onMediaLoad = () => { if (nearBottom.current) scrollDown(); };

  const pickTheme = (c) => {
    setTheme(c);
    setShowThemes(false);
    try { localStorage.setItem(`msgr-theme-${peer.id}`, c); } catch (e) { /* ignore */ }
  };

  const clearFile = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setFile(null);
    setFilePreview(null);
  };

  const pickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      clearFile();
      previewRef.current = URL.createObjectURL(f);
      setFile(f);
      setFilePreview(previewRef.current);
    }
    e.target.value = '';
  };

  const afterSend = (data) => {
    setMsgs((prev) => [...prev, data]);
    sigRef.current = '';
    nearBottom.current = true;
    setReplyTo(null);
    if (seenRef.current) seenRef.current();
  };

  const send = async (e, quick) => {
    if (e) e.preventDefault();
    const text = quick || draft.trim();
    if ((!text && !file) || sending) return;
    setSending(true);
    setErr('');
    const fd = new FormData();
    if (text) fd.append('body', text);
    if (file) fd.append('media', file);
    if (replyTo) fd.append('reply_to_id', replyTo.id);
    try {
      const { data } = await api.post(`/chat/${peer.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      afterSend(data);
      setDraft('');
      clearFile();
      setShowEmoji(false);
    } catch (er) {
      setErr(er.response?.data?.message || 'Could not send. Check the file size/type.');
    } finally {
      setSending(false);
    }
  };

  const sendSticker = async (char) => {
    if (sending) return;
    setSending(true);
    setErr('');
    setShowStickers(false);
    try {
      const { data } = await api.post(`/chat/${peer.id}`, { body: char, sticker: true });
      afterSend(data);
    } catch (er) {
      setErr(er.response?.data?.message || 'Could not send the sticker.');
    } finally {
      setSending(false);
    }
  };

  /* ---- voice messages ---- */
  const sendVoice = async (blob, seconds, type) => {
    const ext = (type || '').includes('mp4') ? 'm4a' : (type || '').includes('ogg') ? 'ogg' : 'webm';
    const fd = new FormData();
    fd.append('audio', blob, `voice.${ext}`);
    fd.append('duration', String(Math.max(1, seconds)));
    if (replyTo) fd.append('reply_to_id', replyTo.id);
    setSending(true);
    setErr('');
    try {
      const { data } = await api.post(`/chat/${peer.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      afterSend(data);
    } catch (er) {
      setErr(er.response?.data?.message || 'Could not send the voice message.');
    } finally {
      setSending(false);
    }
  };
  sendVoiceRef.current = sendVoice; // always the latest version (reply target etc.)

  const startRec = async () => {
    setErr('');
    setShowEmoji(false);
    setShowStickers(false);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      setErr('Voice messages are not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
        .find((t) => window.MediaRecorder.isTypeSupported(t)) || '';
      const mr = new window.MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const r = recRef.current;
      r.chunks = [];
      r.stream = stream;
      r.mr = mr;
      r.cancel = false;
      r.start = Date.now();
      mr.ondataavailable = (ev) => { if (ev.data && ev.data.size) r.chunks.push(ev.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const secs = Math.round((Date.now() - r.start) / 1000);
        const mime = mr.mimeType || type || 'audio/webm';
        if (!r.cancel && r.chunks.length && secs >= 1 && sendVoiceRef.current) {
          sendVoiceRef.current(new Blob(r.chunks, { type: mime }), secs, mime);
        }
      };
      mr.start();
      setRec({ seconds: 0 });
      r.timer = setInterval(() => setRec({ seconds: Math.floor((Date.now() - r.start) / 1000) }), 250);
    } catch (e) {
      setErr('Microphone is blocked. Allow microphone access and try again.');
    }
  };

  const stopRec = (shouldSend) => {
    const r = recRef.current;
    r.cancel = !shouldSend;
    clearInterval(r.timer);
    try { if (r.mr && r.mr.state !== 'inactive') r.mr.stop(); } catch (e) { /* ignore */ }
    setRec(null);
  };

  const react = async (m, type) => {
    try {
      const { data } = await api.post(`/chat/messages/${m.id}/react`, { type });
      setMsgs((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      sigRef.current = '';
    } catch (e) { /* next poll fixes it */ }
  };

  const confirmRemove = async (mode) => {
    const m = removeTarget;
    try {
      await api.delete(`/chat/messages/${m.id}`, { params: { mode } });
    } catch (e) { /* refreshed below */ }
    setRemoveTarget(null);
    await pull();
  };

  const forward = async (userId) => {
    try {
      await api.post(`/chat/messages/${forwardTarget.id}/forward`, { to: userId });
      if (seenRef.current) seenRef.current();
      return true;
    } catch (e) {
      return false;
    }
  };

  const startReply = (m) => {
    setReplyTo(m);
    if (inputRef.current) inputRef.current.focus();
  };

  const lastMine = [...msgs].reverse().find((m) => m.mine);
  const canLike = !draft.trim() && !file;
  const online = !!(conv && conv.online);

  const rows = [];
  msgs.forEach((m, i) => {
    const prev = msgs[i - 1];
    const next = msgs[i + 1];
    const gapPrev = prev ? new Date(m.created_at) - new Date(prev.created_at) : Infinity;
    const gapNext = next ? new Date(next.created_at) - new Date(m.created_at) : Infinity;
    const prevSame = !!prev && prev.mine === m.mine && gapPrev <= GAP; // continues a run
    const nextSame = !!next && next.mine === m.mine && gapNext <= GAP; // run goes on

    if (gapPrev > GAP) {
      rows.push(<div className="cw-stamp" key={`s${m.id}`}>{stamp(m.created_at)}</div>);
    }

    let status = null;
    if (lastMine && lastMine.id === m.id && !m.unsent) {
      status = m.read ? { seen: true } : { text: sentText(m.created_at) };
    }

    rows.push(
      <MessageRow
        key={m.id}
        m={m}
        peer={peer}
        showAvatar={!nextSame}
        cont={prevSame}
        more={nextSame}
        status={status}
        onReply={startReply}
        onReact={react}
        onRemove={setRemoveTarget}
        onForward={setForwardTarget}
        onMedia={setLightbox}
        onMediaLoad={onMediaLoad}
      />,
    );
  });

  const replyPreview = replyTo
    ? (replyTo.unsent ? 'Message unsent'
      : replyTo.audio_url ? 'Voice message'
        : (replyTo.body || (replyTo.media_type === 'video' ? 'Video' : 'Photo')))
    : '';

  // minimized: shrink to a round avatar bubble on the right edge of the screen
  if (min) {
    return (
      <div className="cw-bubble" style={{ '--slot': slot }}>
        <button type="button" className="cw-bubble-main" title={peer.name} onClick={onToggleMin}>
          <img src={avatarOf(peer, 96)} alt={peer.name} />
        </button>
        {online && <i className="presence-dot" />}
        <button type="button" className="cw-bubble-x" title="Close chat" onClick={onClose}><Ico.Close /></button>
        {removeTarget && (
          <RemoveModal m={removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={confirmRemove} />
        )}
      </div>
    );
  }

  return (
    <div className={`cw ${min ? 'min' : ''}`} style={{ '--msgr': theme }}>
      <div className="cw-head">
        <div className="cw-id" onClick={onToggleMin} title={min ? 'Open chat' : 'Minimize chat'}>
          <span className="notif-avatar small">
            <img src={avatarOf(peer, 64)} alt="" />
            {online && <i className="presence-dot" />}
          </span>
          <div className="cw-name">
            <span className="cw-nameline">
              <b>{peer.name}</b>
              <button
                type="button"
                className="cw-chev"
                title="Chat color"
                onClick={(e) => { e.stopPropagation(); setShowThemes((v) => !v); }}
              ><Ico.Chev /></button>
            </span>
            <small>{activeText(online, conv && conv.last_seen)}</small>
          </div>
        </div>
        <button type="button" className="cw-hbtn" title="Minimize" onClick={onToggleMin}><Ico.Minus /></button>
        <button type="button" className="cw-hbtn" title="Close" onClick={onClose}><Ico.Close /></button>
      </div>

      {showThemes && !min && (
        <div className="cw-themes">
          {THEMES.map((c) => (
            <button type="button" key={c} className={c === theme ? 'on' : ''} style={{ background: c }} onClick={() => pickTheme(c)} aria-label={c} />
          ))}
        </div>
      )}

      {!min && (
        <>
          <div className="cw-body" ref={bodyRef} onScroll={onScroll}>
            {loaded && msgs.length === 0 && (
              <div className="cw-empty">
                <img src={avatarOf(peer, 128)} alt="" />
                <b>{peer.name}</b>
                <span>Say hi to start the conversation.</span>
              </div>
            )}
            {rows}
          </div>

          <div className="cw-foot">
            {showEmoji && (
              <div className="cw-emoji-pop">
                <EmojiPanel
                  onPick={(ch, u) => {
                    if (inputRef.current) inputRef.current.insertEmoji(ch, u);
                  }}
                />
              </div>
            )}

            {showStickers && (
              <div className="cw-stickers">
                {STICKERS.map((s) => (
                  <button type="button" key={s} onClick={() => sendSticker(s)}><FbText text={s} size={52} /></button>
                ))}
              </div>
            )}

            {replyTo && (
              <div className="cw-reply-bar">
                <Ico.Reply />
                <div className="t">
                  <b>Replying to {replyTo.mine ? 'yourself' : first(peer.name)}</b>
                  <small>{replyPreview}</small>
                </div>
                <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><Ico.Close /></button>
              </div>
            )}

            {file && (
              <div className="cw-file">
                {file.type.startsWith('video')
                  ? <video src={filePreview} muted />
                  : <img src={filePreview} alt="" />}
                <button type="button" onClick={clearFile} aria-label="Remove attachment"><Ico.Close /></button>
              </div>
            )}

            {err && <div className="cw-err">{err}</div>}

            {rec ? (
              <div className="cw-rec">
                <button type="button" className="cw-ibtn" title="Cancel" onClick={() => stopRec(false)}><Ico.Trash /></button>
                <div className="cw-rec-bar">
                  <i className="cw-rec-dot" />
                  <span>{mmss(rec.seconds)}</span>
                  <em>Recording…</em>
                </div>
                <button type="button" className="cw-ibtn" title="Send voice message" onClick={() => stopRec(true)}><Ico.Send /></button>
              </div>
            ) : (
              <form className="cw-input-row" onSubmit={send}>
                <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={pickFile} />
                <button type="button" className="cw-ibtn" title="Voice message" onClick={startRec}><Ico.Mic /></button>
                <button type="button" className="cw-ibtn" title="Attach a photo or video" onClick={() => fileRef.current && fileRef.current.click()}>
                  <Ico.Image />
                </button>
                <button
                  type="button"
                  className="cw-ibtn"
                  title="Stickers"
                  onClick={() => { setShowStickers((v) => !v); setShowEmoji(false); }}
                ><Ico.Sticker /></button>
                <div className="cw-field">
                  <EmojiInput
                    ref={inputRef}
                    placeholder="Aa"
                    value={draft}
                    onChange={setDraft}
                  />
                  <button
                    type="button"
                    className="cw-ibtn"
                    title="Emoji"
                    onClick={() => { setShowEmoji((v) => !v); setShowStickers(false); }}
                  ><Ico.Smile /></button>
                </div>
                {canLike ? (
                  <button type="button" className="cw-ibtn" title="Send a like" disabled={sending} onClick={() => send(null, '👍')}>
                    <Ico.Like />
                  </button>
                ) : (
                  <button type="submit" className="cw-ibtn" title="Send" disabled={sending}><Ico.Send /></button>
                )}
              </form>
            )}
          </div>
        </>
      )}

      {removeTarget && (
        <RemoveModal m={removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={confirmRemove} />
      )}
      {forwardTarget && (
        <ForwardModal
          m={forwardTarget}
          friends={friends.filter((c) => c.user.id !== peer.id)}
          onClose={() => setForwardTarget(null)}
          onSend={forward}
        />
      )}
      {lightbox && <Lightbox media={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dock (bottom-right) that holds up to 2 windows                      */
/* ------------------------------------------------------------------ */
export function ChatDock({ peers, conversations, onClose, onSeen }) {
  const [mins, setMins] = useState({});
  if (peers.length === 0) return null;

  const toggle = (id) => setMins((m) => ({ ...m, [id]: !m[id] }));
  let slot = -1;

  return (
    <div className={`msgr-dock ${peers.some((p) => mins[p.id]) ? 'has-min' : ''}`}>
      {peers.map((p) => {
        const conv = conversations.find((c) => c.user.id === p.id);
        const min = !!mins[p.id];
        if (min) slot += 1;
        return (
          <ChatWindow
            key={p.id}
            peer={conv ? { ...p, ...conv.user } : p}
            conv={conv}
            friends={conversations}
            onClose={() => onClose(p.id)}
            onSeen={onSeen}
            min={min}
            slot={min ? slot : 0}
            onToggleMin={() => toggle(p.id)}
          />
        );
      })}
    </div>
  );
}