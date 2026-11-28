import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { avatarOf, timeAgo } from '../utils/people';
import PostMedia from './PostMedia';
import '../styles/postmodal.css';

const IcClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const IcGlobe = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.500 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18" />
  </svg>
);

/* "<Name>'s Post" pop-up: the whole post + comments, with a comment bar at the bottom */
export default function PostModal({ postId, onClose }) {
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const bodyRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    let live = true;
    api.get(`/posts/${postId}`)
      .then((r) => { if (live) setPost(r.data); })
      .catch(() => { if (live) setError('This post isn’t available.'); });
    api.get(`/posts/${postId}/comments`)
      .then((r) => { if (live) setComments(r.data); })
      .catch(() => { /* ignore */ });
    return () => { live = false; };
  }, [postId]);

  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { body });
      setComments((c) => [...c, data]);
      setText('');
      requestAnimationFrame(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; });
    } catch (e) { /* ignore */ } finally {
      setBusy(false);
    }
  };

  const firstName = post ? post.user.name : '';

  return createPortal(
    <div className="pmd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pmd-box" role="dialog" aria-modal="true">
        <div className="pmd-head">
          <h2>{post ? `${firstName}’s Post` : 'Post'}</h2>
          <button type="button" className="pmd-x" aria-label="Close" onClick={onClose}><IcClose /></button>
        </div>

        <div className="pmd-body" ref={bodyRef}>
          {!post && !error && <div className="pmd-empty">Loading…</div>}
          {error && <div className="pmd-empty">{error}</div>}

          {post && (
            <>
              <div className="pmd-author">
                <img src={avatarOf(post.user)} alt="" />
                <div>
                  <strong>{post.user.name}</strong>
                  <small>{timeAgo(post.created_at)} · <IcGlobe /></small>
                </div>
              </div>

              {post.body && <p className="pmd-text">{post.body}</p>}

              {post.shared && (
                <div className="pmd-shared">
                  <div className="pmd-author">
                    <img src={avatarOf(post.shared.user)} alt="" />
                    <div>
                      <strong>{post.shared.user.name}</strong>
                      <small>{timeAgo(post.shared.created_at)} · <IcGlobe /></small>
                    </div>
                  </div>
                  {post.shared.body && <p className="pmd-text">{post.shared.body}</p>}
                  <PostMedia post={post.shared} onChange={() => {}} />
                </div>
              )}

              <PostMedia post={post} bleed onChange={() => {}} />

              <div className="pmd-counts">
                <span>{post.likes_count > 0 ? `${post.likes_count} reaction${post.likes_count === 1 ? '' : 's'}` : ''}</span>
                <span>
                  {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? '' : 's'}` : ''}
                  {post.shares_count > 0 ? `${comments.length > 0 ? ' · ' : ''}${post.shares_count} share${post.shares_count === 1 ? '' : 's'}` : ''}
                </span>
              </div>

              <div className="pmd-comments">
                {comments.map((c) => (
                  <div className="pmd-comment" key={c.id}>
                    <img src={avatarOf(c.user, 64)} alt="" />
                    <div>
                      <div className="pmd-bubble"><b>{c.user.name}</b><span>{c.body}</span></div>
                      <small>{timeAgo(c.created_at)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="pmd-bar">
          <img src={avatarOf(user, 64)} alt="" />
          <input
            placeholder="Write a comment…"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
            disabled={!post}
          />
          <button type="button" className="pmd-send" disabled={!text.trim() || busy} onClick={send}>Post</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}