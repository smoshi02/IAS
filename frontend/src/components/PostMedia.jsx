import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { avatarOf, timeAgo } from '../utils/people';
import '../styles/postmedia.css';

export const MAX_FILES = 20;

/* ---------- helpers used by the composers ---------- */
export const makeItems = (files) => Array.from(files || []).map((file) => ({
  file,
  url: URL.createObjectURL(file),
  isVideo: file.type.startsWith('video'),
}));
export const revokeItems = (items) => items.forEach((i) => URL.revokeObjectURL(i.url));

// every photo/video on a post as [{ url, type }] (older posts only have media_url)
export function mediaOf(post) {
  if (post && post.media && post.media.length) return post.media;
  if (post && post.media_url) return [{ url: post.media_url, type: post.media_type || 'image' }];
  return [];
}

/* thumbnails shown in the composer before posting */
export function MediaPreviewStrip({ items, onRemove, onAdd }) {
  if (!items.length) return null;
  return (
    <div className="pm-strip">
      {items.map((it, i) => (
        <div className="pm-thumb" key={it.url}>
          {it.isVideo ? <video src={it.url} muted /> : <img src={it.url} alt="" />}
          <button type="button" className="pm-thumb-x" aria-label="Remove" onClick={() => onRemove(i)}>&times;</button>
        </div>
      ))}
      {items.length < MAX_FILES && (
        <button type="button" className="pm-thumb pm-add" onClick={onAdd}>
          <b>+</b><span>Add more</span>
        </button>
      )}
    </div>
  );
}

/* ---------- small icons ---------- */
const sv = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IcX = () => <svg {...sv} width="22" height="22"><path d="M6 6l12 12M18 6L6 18" /></svg>;
const IcLeft = () => <svg {...sv} width="22" height="22"><path d="m15 5-7 7 7 7" /></svg>;
const IcRight = () => <svg {...sv} width="22" height="22"><path d="m9 5 7 7-7 7" /></svg>;
const IcZoomIn = () => <svg {...sv} width="20" height="20"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M11 8v6M8 11h6" /></svg>;
const IcZoomOut = () => <svg {...sv} width="20" height="20"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M8 11h6" /></svg>;
const IcFull = () => <svg {...sv} width="20" height="20"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
const IcLike = () => (
  <svg {...sv} width="22" height="22">
    <rect x="2.6" y="10.6" width="4.9" height="10.8" rx="1.3" />
    <path d="M7.5 11.4L11.2 3.8a1.8 1.8 0 0 1 3.3 1L13.9 9.5h5.7a1.9 1.9 0 0 1 1.8 2.5l-1.8 7.3a1.9 1.9 0 0 1-1.8 1.4H7.5" />
  </svg>
);
const IcComment = () => <svg {...sv} width="22" height="22"><path d="M18.6 16.2L20.4 20.2L15.4 18.9A8.6 8.6 0 1 1 18.6 16.2Z" /></svg>;

/* ---------- full-screen photo viewer ---------- */
function PhotoViewer({ post, items, start, onClose, onChange }) {
  const { user } = useAuth();
  const [idx, setIdx] = useState(start);
  const [zoom, setZoom] = useState(1);
  const [comments, setComments] = useState(null);
  const [draft, setDraft] = useState('');
  const [stats, setStats] = useState({
    my: post.my_reaction || null,
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
  });
  const stageRef = useRef(null);
  const inputRef = useRef(null);
  const n = items.length;
  const current = items[idx];

  const go = useCallback((d) => {
    setIdx((i) => Math.min(n - 1, Math.max(0, i + d)));
    setZoom(1);
  }, [n]);

  // keyboard: Esc closes, arrows move between photos; page behind stops scrolling
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.target.tagName !== 'INPUT') {
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/posts/${post.id}/comments`)
      .then((r) => { if (!cancelled) setComments(r.data); })
      .catch(() => { if (!cancelled) setComments([]); });
    return () => { cancelled = true; };
  }, [post.id]);

  const toggleLike = async () => {
    try {
      const { data } = await api.post(`/posts/${post.id}/like`, { type: stats.my || 'like' });
      setStats((s) => ({ ...s, my: data.my_reaction, likes: data.likes_count }));
      if (onChange) onChange({ my_reaction: data.my_reaction, likes_count: data.likes_count, reactions: data.reactions });
    } catch (e) { /* ignore */ }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, { body: text });
      setComments((c) => [...(c || []), data]);
      setDraft('');
      setStats((s) => ({ ...s, comments: s.comments + 1 }));
      if (onChange) onChange({ comments_count: stats.comments + 1 });
    } catch (e) { /* ignore */ }
  };

  const toggleFull = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
  };

  const isVideo = current.type === 'video';

  return createPortal(
    <div className="pv-overlay" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div
        className="pv-stage"
        ref={stageRef}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <button type="button" className="pv-btn pv-close" aria-label="Close" onClick={onClose}><IcX /></button>

        {!isVideo && (
          <div className="pv-tools">
            <button type="button" className="pv-btn" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + 0.5))}><IcZoomIn /></button>
            <button type="button" className="pv-btn" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.5))}><IcZoomOut /></button>
            <button type="button" className="pv-btn" aria-label="Full screen" onClick={toggleFull}><IcFull /></button>
          </div>
        )}

        {idx > 0 && <button type="button" className="pv-btn pv-nav prev" aria-label="Previous" onClick={() => go(-1)}><IcLeft /></button>}
        {idx < n - 1 && <button type="button" className="pv-btn pv-nav next" aria-label="Next" onClick={() => go(1)}><IcRight /></button>}

        {isVideo
          ? <video key={current.url} className="pv-media" src={current.url} controls autoPlay />
          : <img key={current.url} className="pv-media" src={current.url} alt="" style={{ transform: `scale(${zoom})` }} draggable={false} />}

        {n > 1 && <div className="pv-count">{idx + 1} / {n}</div>}
      </div>

      <aside className="pv-side">
        <div className="pv-from">
          <span>This {isVideo ? 'video' : 'photo'} is from a post.</span>
          <button type="button" onClick={onClose}>View post</button>
        </div>

        <div className="pv-author">
          <img src={avatarOf(post.user, 80)} alt="" />
          <div>
            <b>{post.user.name}</b>
            <small>{timeAgo(post.created_at)} &middot; Public</small>
          </div>
        </div>
        {post.body && <p className="pv-body">{post.body}</p>}

        <div className="pv-actions">
          <button type="button" className={stats.my ? 'on' : ''} onClick={toggleLike}>
            <IcLike /> {stats.likes > 0 && <em>{stats.likes}</em>}
          </button>
          <button type="button" onClick={() => inputRef.current && inputRef.current.focus()}>
            <IcComment /> {stats.comments > 0 && <em>{stats.comments}</em>}
          </button>
        </div>

        <div className="pv-comments">
          {comments === null && <div className="pv-empty">Loading comments…</div>}
          {comments && comments.length === 0 && (
            <div className="pv-empty">
              <svg viewBox="0 0 24 24" width="64" height="64" aria-hidden="true">
                <path fill="#c9ccd1" d="M5 2h9l5 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                <path fill="#1877f2" d="M14 2l5 5h-4a1 1 0 0 1-1-1Z" />
                <path stroke="#fff" strokeWidth="1.6" strokeLinecap="round" d="M7 12h10M7 15.5h10" />
              </svg>
              <b>No comments yet</b>
              <span>Be the first to comment.</span>
            </div>
          )}
          {(comments || []).map((c) => (
            <div className="pv-comment" key={c.id}>
              <img src={avatarOf(c.user, 64)} alt="" />
              <div className="pv-bubble"><b>{c.user.name}</b><span>{c.body}</span></div>
            </div>
          ))}
        </div>

        <div className="pv-write">
          <img src={avatarOf(user, 64)} alt="" />
          <input
            ref={inputRef}
            placeholder="Write a comment…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          />
          <button type="button" disabled={!draft.trim()} onClick={send}>Send</button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

/* ---------- the photo grid inside a post ---------- */
function Tile({ m, extra, onClick }) {
  return (
    <button type="button" className="pm-tile" onClick={onClick}>
      {m.type === 'video'
        ? <><video src={`${m.url}#t=0.1`} muted preload="metadata" /><span className="pm-play" /></>
        : <img src={m.url} alt="" loading="lazy" />}
      {extra > 0 && <span className="pm-more">+{extra}</span>}
    </button>
  );
}

export default function PostMedia({ post, bleed = false, onChange }) {
  const items = mediaOf(post);
  const [open, setOpen] = useState(null);
  if (!items.length) return null;

  const n = items.length;
  const bleedCls = bleed ? ' pm-bleed' : '';

  // a lone video just plays in place
  if (n === 1 && items[0].type === 'video') {
    return <video className={`pm-solo-video${bleedCls}`} src={items[0].url} controls />;
  }

  const shown = items.slice(0, 5);
  const extra = n > 5 ? n - 5 : 0;

  return (
    <>
      <div className={`pm-grid pm-n${shown.length}${bleedCls}`}>
        {shown.map((m, i) => (
          <Tile key={i} m={m} extra={i === shown.length - 1 ? extra : 0} onClick={() => setOpen(i)} />
        ))}
      </div>
      {open !== null && (
        <PhotoViewer post={post} items={items} start={open} onClose={() => setOpen(null)} onChange={onChange} />
      )}
    </>
  );
}