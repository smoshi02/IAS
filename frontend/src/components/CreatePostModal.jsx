import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { avatarOf } from '../utils/people';
import EmojiPicker from './EmojiPicker';
import '../styles/home.css';
import '../styles/createpost.css';

const PICKER_W = 326;
const PICKER_H = 400;

const IcClose = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const IcPencil = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L18.8 8.95l-3.75-3.75L3 17.25Zm17.7-10.2a1 1 0 0 0 0-1.4l-2.35-2.35a1 1 0 0 0-1.4 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" /></svg>
);
const IcCaret = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="m6 9 6 6 6-6Z" /></svg>
);
const IcSmile = ({ c = '#f7721e', s = 24 }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="2" />
    <circle cx="8.8" cy="10" r="1.2" fill={c} /><circle cx="15.2" cy="10" r="1.2" fill={c} />
    <path d="M7.8 14c1 1.8 2.5 2.6 4.2 2.6s3.2-.8 4.2-2.6" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function CreatePostModal({
  user, text, onText, items, onRemove, onClear, onPick, posting, error, onSubmit, onClose,
}) {
  const [editing, setEditing] = useState(false);
  const [emojiPos, setEmojiPos] = useState(null); // null = picker closed, else { top, left }
  const taRef = useRef(null);
  const popRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const emojiOpenRef = useRef(false);
  emojiOpenRef.current = emojiPos !== null;

  const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';
  const canPost = Boolean(text.trim() || items.length) && !posting;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (emojiOpenRef.current) setEmojiPos(null); // Esc closes the emoji picker first
      else closeRef.current();
    };
    // click anywhere outside the picker (and its two buttons) closes it
    const onDown = (e) => {
      if (!emojiOpenRef.current) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.cp-emoji-trigger')) return;
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

  useEffect(() => { if (!items.length) setEditing(false); }, [items.length]);

  const grow = (el) => { if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 180)}px`; };
  useEffect(() => { grow(taRef.current); }, [text]);

  // open the full emoji picker next to whichever button was pressed
  const toggleEmoji = (e) => {
    if (emojiPos) { setEmojiPos(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.right - PICKER_W, window.innerWidth - PICKER_W - 8));
    const below = r.bottom + 6;
    const top = below + PICKER_H > window.innerHeight - 8 ? Math.max(8, r.top - 6 - PICKER_H) : below;
    setEmojiPos({ top, left });
  };

  // put the emoji where the cursor is (not just at the end)
  const insertEmoji = (ch) => {
    const ta = taRef.current;
    if (!ta) { onText(`${text}${ch}`); return; }
    const s = ta.selectionStart == null ? text.length : ta.selectionStart;
    const e = ta.selectionEnd == null ? text.length : ta.selectionEnd;
    onText(`${text.slice(0, s)}${ch}${text.slice(e)}`);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + ch.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const shown = items.slice(0, 5);
  const extra = items.length > 5 ? items.length - 5 : 0;

  return createPortal(
    <div className="cp-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !posting) onClose(); }}>
      <form className="cp-box" onSubmit={onSubmit} role="dialog" aria-modal="true" aria-label="Create post">
        <div className="cp-head">
          <h2>Create post</h2>
          <button type="button" className="cp-x" aria-label="Close" disabled={posting} onClick={onClose}><IcClose /></button>
        </div>

        <div className="cp-body">
          <div className="cp-user">
            <img src={avatarOf(user, 80)} alt="" />
            <div>
              <div className="cp-name">{name}</div>
              <div className="cp-chips">
                <span className="cp-chip">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9 13c-3 0-6 1.5-6 4v2h12v-2c0-2.500-3-4-6-4Zm7 0c-.6 0-1.200.1-1.700.2 1.100.9 1.700 2.100 1.700 3.500V19h5v-2c0-2.100-2.300-4-5-4Z" /></svg>
                  Public <IcCaret />
                </span>
                <span className="cp-chip">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3.5" y="4.5" width="15" height="15" rx="3" /><path d="M19 3v4M17 5h4" strokeLinecap="round" /></svg>
                  AI label off <IcCaret />
                </span>
              </div>
            </div>
          </div>

          <div className="cp-text">
            <textarea
              ref={taRef}
              rows={2}
              placeholder={`What's on your mind, ${user?.first_name || ''}?`}
              value={text}
              onChange={(e) => onText(e.target.value)}
              maxLength={2000}
            />
            <button type="button" className="cp-emoji-btn cp-emoji-trigger" aria-label="Emoji" onClick={toggleEmoji}>
              <IcSmile c="#65676b" s={24} />
            </button>
          </div>

          {error && <div className="cp-error">{error}</div>}

          {items.length > 0 && (
            <div className="cp-media">
              {editing ? (
                <>
                  <div className="cp-edit">
                    {items.map((it, i) => (
                      <div className="cp-etile" key={it.url}>
                        {it.isVideo ? <video src={it.url} muted /> : <img src={it.url} alt="" />}
                        <button type="button" className="cp-etile-x" aria-label="Remove" onClick={() => onRemove(i)}>&times;</button>
                      </div>
                    ))}
                    <button type="button" className="cp-etile cp-addtile" onClick={onPick}><b>+</b><span>Add more</span></button>
                  </div>
                  <button type="button" className="cp-editall" onClick={() => setEditing(false)}>Done</button>
                </>
              ) : (
                <>
                  <div className={`cp-grid cp-n${shown.length}`}>
                    {shown.map((it, i) => (
                      <div className="cp-tile" key={it.url}>
                        {it.isVideo ? <video src={`${it.url}#t=0.1`} muted preload="metadata" /> : <img src={it.url} alt="" />}
                        {it.isVideo && <span className="cp-play" />}
                        {extra > 0 && i === shown.length - 1 && <span className="cp-more">+{extra}</span>}
                      </div>
                    ))}
                  </div>
                  <button type="button" className="cp-editall" onClick={() => setEditing(true)}><IcPencil /> Edit all</button>
                  <button type="button" className="cp-clear" aria-label="Remove all" onClick={onClear}><IcClose /></button>
                </>
              )}
            </div>
          )}

          <div className="cp-add">
            <span>Add to your post</span>
            <div className="cp-add-icons">
              <button type="button" title="Photo/video" aria-label="Photo/video" onClick={onPick}>
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                  <rect x="2.5" y="3.5" width="19" height="17" rx="3" fill="#45bd62" />
                  <circle cx="8.5" cy="9" r="1.9" fill="#fff" />
                  <path fill="#fff" d="m4.5 18 5-5.2a1 1 0 0 1 1.4 0l1.6 1.6 3.1-3.6a1 1 0 0 1 1.5 0L20 15.2V18Z" />
                </svg>
              </button>
              <span className="off" title="Not available yet">
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <circle cx="9" cy="8" r="3.6" fill="#1877f2" /><path fill="#1877f2" d="M2.500 19c0-3.300 2.900-5.500 6.500-5.500s6.500 2.200 6.500 5.500Z" />
                  <path stroke="#1877f2" strokeWidth="2" strokeLinecap="round" d="M19 4v5M16.500 6.500h5" />
                </svg>
              </span>
              <button type="button" className="cp-emoji-trigger" title="Emoji" aria-label="Emoji" onClick={toggleEmoji}><IcSmile s={26} /></button>
              <span className="off" title="Not available yet">
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path fill="#f3425f" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Z" /><circle cx="12" cy="9" r="2.600" fill="#fff" />
                </svg>
              </span>
              <span className="off" title="Not available yet">
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path d="M5 3v18" stroke="#a3a7ad" strokeWidth="2" strokeLinecap="round" /><path fill="#c9ccd1" d="M7 4.500c2.800-1.500 4.700 1.500 7.800 0 1.700-.8 3.200-.8 4.700-.2v9.200c-1.500-.6-3-.6-4.700.2-3.100 1.500-5-1.500-7.800 0Z" />
                </svg>
              </span>
              <span className="off" title="Not available yet">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#65676b" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
              </span>
            </div>
          </div>
        </div>

        <div className="cp-foot">
          <button type="submit" className="cp-post" disabled={!canPost}>{posting ? 'Posting…' : 'Post'}</button>
        </div>
      </form>

      {emojiPos && (
        <div className="cp-emoji-pop" ref={popRef} style={{ top: emojiPos.top, left: emojiPos.left }}>
          <EmojiPicker onPick={(ch) => insertEmoji(ch)} />
        </div>
      )}
    </div>,
    document.body,
  );
}