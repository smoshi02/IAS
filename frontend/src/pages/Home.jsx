import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { IconLogoMark, IconSearch, IconBell, IconUsers, IconUser, IconHome, IconImage, IconBookmark, IconClock, IconThumbsUp, IconComment, IconShare, IconLogout, IconPlus } from '../components/Icons';
import SimAd from '../components/SimAd';
import Stories from '../components/Stories';
import '../styles/home.css';
import PostMenu from '../components/PostMenu';


function avatarUrl(name, bg) {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=fff&bold=true&size=128`;
}

const COLORS = ['2C6BED', '42B72A', 'F0902F', '9b59b6', '16a085'];
const colorFor = (id) => COLORS[Math.abs(Number(id) || 0) % COLORS.length];

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const stories = [
  { id: 1, name: 'Maya Santos', color: '2C6BED' },
  { id: 2, name: 'Jordan Cruz', color: '42B72A' },
  { id: 3, name: 'Priya Nair', color: 'F0902F' },
];

const SECTIONS = {
  feed: 'Home',
  friends: 'Friends',
  groups: 'Groups',
  saved: 'Saved',
  memories: 'Memories',
  photos: 'Photos',
};

const NAV_TABS = [
  { key: 'feed', label: 'Home', Icon: IconHome },
  { key: 'friends', label: 'Friends', Icon: IconUser },
  { key: 'groups', label: 'Groups', Icon: IconUsers },
  { key: 'saved', label: 'Saved', Icon: IconBookmark },
  { key: 'memories', label: 'Memories', Icon: IconClock },
];

const SIDE_ITEMS = [
  { key: 'friends', Icon: IconUser },
  { key: 'groups', Icon: IconUsers },
  { key: 'saved', Icon: IconBookmark },
  { key: 'memories', Icon: IconClock },
  { key: 'photos', Icon: IconImage },
];

const featured = [
  { id: 1, title: 'Capstone Showcase', sub: 'Dec 5 · Main Hall', color: '2C6BED' },
  { id: 2, title: 'Web Security Workshop', sub: 'Friday · Room 204', color: 'F0902F' },
];

const contacts = [
  { id: 1, name: 'Alex Rivera', color: '9b59b6' },
  { id: 2, name: 'Sam Oduya', color: 'e67e22' },
  { id: 3, name: 'Lin Zhao', color: '16a085' },
  { id: 4, name: 'Maya Santos', color: '2C6BED' },
];

const TOAST_DELAY = 6000;

function AdToast({ onOpen }) {
  const [visible, setVisible] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), TOAST_DELAY);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;
  return (
    <div
      className="ad-toast"
      role="button"
      tabIndex={0}
      aria-label="Sponsored notification: Daily Brand Discounts"
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
    >
      <button
        type="button"
        className="ad-toast-x"
        aria-label="Dismiss"
        onClick={(e) => { e.stopPropagation(); setVisible(false); }}
      >
        &times;
      </button>
      <div className="ad-toast-thumb">
        {imgOk && <img src="/images/bannerad.jpg" alt="" onError={() => setImgOk(false)} />}
      </div>
      <div className="ad-toast-text">
        <div className="ad-toast-source">Shoppa &middot; Sponsored</div>
        <div className="ad-toast-title">Daily Brand Discounts</div>
        <div className="ad-toast-body">Collect golden tickets and stand a chance to win vouchers.</div>
      </div>
    </div>
  );
}

function PostMedia({ post }) {
  if (!post.media_url) return null;
  return post.media_type === 'video'
    ? <video className="post-media" src={post.media_url} controls />
    : <img className="post-media" src={post.media_url} alt="Post" />;
}

const REACTIONS = [
  { key: 'like',  emoji: '👍', label: 'Like',  color: '#1877f2' },
  { key: 'love',  emoji: '❤️', label: 'Love',  color: '#f33e58' },
  { key: 'haha',  emoji: '😆', label: 'Haha',  color: '#f7b125' },
  { key: 'wow',   emoji: '😮', label: 'Wow',   color: '#f7b125' },
  { key: 'sad',   emoji: '😢', label: 'Sad',   color: '#f7b125' },
  { key: 'angry', emoji: '😡', label: 'Angry', color: '#e9710f' },
];
const reactionOf = (k) => REACTIONS.find((r) => r.key === k);

function ReactionButton({ post, onReact }) {
  const mine = reactionOf(post.my_reaction);
  return (
    <div className="react-wrap">
      <div className="react-picker">
        {REACTIONS.map((r) => (
          <button type="button" key={r.key} title={r.label} onClick={() => onReact(post.id, r.key)}>
            {r.emoji}
          </button>
        ))}
      </div>
      <span
        onClick={() => onReact(post.id, post.my_reaction || 'like')}
        style={mine ? { color: mine.color, fontWeight: 700 } : undefined}
      >
        {mine ? <>{mine.emoji} {mine.label}</> : <><IconThumbsUp /> Like</>}
      </span>
    </div>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareText, setShareText] = useState('');
  const [sharing, setSharing] = useState(false);
  const [section, setSection] = useState('feed');
  const [query, setQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [composerText, setComposerText] = useState('');
  const [composerFile, setComposerFile] = useState(null);
  const [composerPreview, setComposerPreview] = useState(null);
  const [chat, setChat] = useState(null);
  const [chatLog, setChatLog] = useState({});
  const [chatDraft, setChatDraft] = useState('');
  const fileRef = useRef(null);
  const composerRef = useRef(null);

  const userFullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';

  const loadPosts = async (p = 1) => {
    try {
      const { data } = await api.get('/posts', { params: { page: p } });
      setPosts((prev) => (p === 1 ? data.data : [...prev, ...data.data]));
      setPage(data.current_page);
      setLastPage(data.last_page);
    } catch (e) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(1); }, []);

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) { /* ignore */ }
    logout();
    navigate('/login');
  };

  const updatePost = (id, patch) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const react = async (id, type = 'like') => {
    try {
      const { data } = await api.post(`/posts/${id}/like`, { type });
      updatePost(id, { my_reaction: data.my_reaction, likes_count: data.likes_count, reactions: data.reactions });
    } catch (e) { /* ignore */ }
  };

  const toggleComments = async (id) => {
    const willOpen = !openComments[id];
    setOpenComments((prev) => ({ ...prev, [id]: willOpen }));
    if (willOpen && !commentsMap[id]) {
      try {
        const { data } = await api.get(`/posts/${id}/comments`);
        setCommentsMap((prev) => ({ ...prev, [id]: data }));
      } catch (e) { /* ignore */ }
    }
  };

  const submitComment = async (id) => {
    const text = (commentDraft[id] || '').trim();
    if (!text) return;
    try {
      const { data } = await api.post(`/posts/${id}/comments`, { body: text });
      setCommentsMap((prev) => ({ ...prev, [id]: [...(prev[id] || []), data] }));
      setCommentDraft((prev) => ({ ...prev, [id]: '' }));
      const post = posts.find((p) => p.id === id);
      if (post) updatePost(id, { comments_count: post.comments_count + 1 });
    } catch (e) { /* ignore */ }
  };

  const closeShare = () => {
    if (sharing) return;
    setShareTarget(null);
    setShareText('');
  };

  const confirmShare = async () => {
    if (!shareTarget) return;
    const post = shareTarget;
    setSharing(true);
    try {
      const body = shareText.trim();
      const { data } = await api.post(`/posts/${post.id}/share`, body ? { body } : {});
      setPosts((prev) => [data, ...prev.map((p) => (p.id === post.id ? { ...p, shares_count: p.shares_count + 1 } : p))]);
      setShareTarget(null);
      setShareText('');
    } catch (e) { /* ignore */ } finally {
      setSharing(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${deleteId}`);
      setPosts((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (e) { /* ignore */ } finally {
      setDeleting(false);
    }
  };
  const clearFile = () => {
    if (composerPreview) URL.revokeObjectURL(composerPreview);
    setComposerFile(null);
    setComposerPreview(null);
  };

  const submitNewPost = async (e) => {
    e.preventDefault();
    const text = composerText.trim();
    if ((!text && !composerFile) || posting) return;
    setPosting(true);
    setPostError('');
    const fd = new FormData();
    if (text) fd.append('body', text);
    if (composerFile) fd.append('media', composerFile);
    try {
      const { data } = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts((prev) => [data, ...prev]);
      setComposerText('');
      clearFile();
    } catch (err) {
      setPostError(err.response?.data?.message || 'Could not post. Check the file size/type.');
    } finally {
      setPosting(false);
    }
  };

  const pickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (composerPreview) URL.revokeObjectURL(composerPreview);
      setComposerFile(file);
      setComposerPreview(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const insertSymbol = (symbol) => {
    setComposerText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}${symbol}`);
    if (composerRef.current) composerRef.current.focus();
  };

  const openChat = (contact) => { setChat(contact); setChatDraft(''); };

  const sendChat = (e) => {
    e.preventDefault();
    const text = chatDraft.trim();
    if (!text || !chat) return;
    setChatLog((prev) => ({ ...prev, [chat.id]: [...(prev[chat.id] || []), text] }));
    setChatDraft('');
  };

  const visiblePosts = useMemo(() => {
    let list = posts;
    if (section !== 'feed') list = [];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) =>
        (p.body || '').toLowerCase().includes(q) || p.user.name.toLowerCase().includes(q));
    }
    return list;
  }, [posts, section, query]);

  return (
    <div className="home-page">
      <nav className="home-nav">
        <div className="nav-left">
          <div className="nav-logo" onClick={() => { setSection('feed'); navigate('/home'); }}>
            <IconLogoMark />
          </div>
          <div className="nav-search">
            <IconSearch />
            <input
              placeholder="Search Phishbook"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="nav-tabs">
          {NAV_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              title={label}
              className={`nav-tab ${section === key ? 'active' : ''}`}
              onClick={() => setSection(key)}
            >
              <Icon />
            </button>
          ))}
        </div>

        <div className="nav-actions">
          <button type="button" title="Notifications" className="nav-circle" onClick={() => setShowNotifs((v) => !v)}>
            <IconBell />
            {showNotifs && (
              <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="notif-item">Jordan Cruz commented on your post.</div>
                <div className="notif-item">Priya Nair liked your post.</div>
                <div className="notif-item">You have 2 new friend suggestions.</div>
              </div>
            )}
          </button>
          <button type="button" title="Profile" className="nav-circle" onClick={() => navigate('/profile')}><IconUser /></button>
          <button type="button" title="Logout" className="nav-circle" onClick={handleLogout}><IconLogout /></button>
        </div>
      </nav>

      <div className="home-body">
        <aside className="sidebar left">
          <ul>
            <li onClick={() => navigate('/profile')}>
              <img className="side-avatar" src={avatarUrl(userFullName, '2C6BED')} alt={userFullName} />
              {userFullName}
            </li>
            {SIDE_ITEMS.map(({ key, Icon }) => (
              <li key={key} className={section === key ? 'active' : ''} onClick={() => setSection(key)}>
                <span className="side-icon"><Icon /></span>
                {SECTIONS[key]}
              </li>
            ))}
          </ul>
        </aside>

        <main className="feed">
          <h2 className="feed-heading">{SECTIONS[section]}</h2>

          {section === 'feed' && (
            <form className="create-post" onSubmit={submitNewPost}>
              <div className="composer-row">
                <img className="avatar" src={avatarUrl(userFullName, '2C6BED')} alt={userFullName} />
                <input
                  ref={composerRef}
                  placeholder={`What's on your mind, ${user?.first_name || ''}?`}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                />
                <div className="composer-tools">
                  <button type="button" title="Add photo or video" onClick={() => fileRef.current && fileRef.current.click()}><IconImage /></button>
                  <button type="button" title="Mention someone" onClick={() => insertSymbol('@')}><IconUsers /></button>
                  <button type="button" title="Add hashtag" onClick={() => insertSymbol('#')}>#</button>
                </div>
                <button type="submit" className="post-btn" disabled={posting || (!composerText.trim() && !composerFile)}>
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={pickFile} />
              {composerPreview && (
                <div className="composer-preview">
                  {composerFile && composerFile.type.startsWith('video')
                    ? <video src={composerPreview} controls />
                    : <img src={composerPreview} alt="Selected" />}
                  <button type="button" onClick={clearFile}>Remove</button>
                </div>
              )}
              {postError && <div className="post-error">{postError}</div>}
            </form>
          )}

          {section === 'feed' && <Stories />}

          {visiblePosts.map((post, idx) => (
            <React.Fragment key={post.id}>
            {section === 'feed' && idx === 1 && (
              <div className="feed-ad"><SimAd variant="default" /></div>
            )}
            <div className="post-card">
              <div className="post-header">
                <img className="avatar" src={avatarUrl(post.user.name, colorFor(post.user.id))} alt={post.user.name} />
                <div style={{ flex: 1 }}>
                  <div className="post-author">{post.user.name}</div>
                  <div className="post-time">{timeAgo(post.created_at)} &middot; Public</div>
                </div>
                {user?.id === post.user.id && (
                  <PostMenu onDelete={() => setDeleteId(post.id)} />
                )}
              </div>
              {post.body && <p className="post-text">{post.body}</p>}
              <PostMedia post={post} />
              {post.shared && (
                <div className="shared-post">
                  <div className="post-header">
                    <img className="avatar" src={avatarUrl(post.shared.user.name, colorFor(post.shared.user.id))} alt={post.shared.user.name} />
                    <div>
                      <div className="post-author">{post.shared.user.name}</div>
                      <div className="post-time">{timeAgo(post.shared.created_at)}</div>
                    </div>
                  </div>
                  {post.shared.body && <p className="post-text">{post.shared.body}</p>}
                  <PostMedia post={post.shared} />
                </div>
              )}

              {post.likes_count > 0 && (
                <div className="reaction-summary">
                  {Object.keys(post.reactions || {}).map((k) => (
                    <span key={k}>{reactionOf(k)?.emoji}</span>
                  ))}{' '}
                  {post.likes_count}
                </div>
              )}

              <div className="post-actions">
                <ReactionButton post={post} onReact={react} />
                <span onClick={() => toggleComments(post.id)}>
                  <IconComment /> Comment ({post.comments_count})
                </span>
                <span onClick={() => { setShareText(''); setShareTarget(post); }}>
                  <IconShare /> Share ({post.shares_count})
                </span>
              </div>

              {openComments[post.id] && (
                <div className="comment-section">
                  {(commentsMap[post.id] || []).map((c) => (
                    <div className="comment-bubble" key={c.id}><strong>{c.user.name}</strong> {c.body}</div>
                  ))}
                  <div className="comment-input-row">
                    <input
                      placeholder="Write a comment..."
                      value={commentDraft[post.id] || ''}
                      onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitComment(post.id); }}
                    />
                    <button onClick={() => submitComment(post.id)}>Send</button>
                  </div>
                </div>
              )}
            </div>
            </React.Fragment>
          ))}

          {section === 'feed' && page < lastPage && !query.trim() && (
            <button type="button" className="post-btn load-more" onClick={() => loadPosts(page + 1)}>Load more</button>
          )}

          {!loading && visiblePosts.length === 0 && (
            <div className="empty-state">Nothing here yet.</div>
          )}
        </main>

        <aside className="sidebar right">
          <SimAd variant="sidebar" />
          {featured.map((f) => (
            <div className="feature-card" key={f.id}>
              <div className="feature-thumb" style={{ background: `linear-gradient(160deg, #${f.color}, #1C3FAE)` }}><IconImage /></div>
              <div className="feature-text">
                <div className="feature-title">{f.title}</div>
                <div className="feature-sub">{f.sub}</div>
              </div>
            </div>
          ))}
          <hr className="side-divider" />
          <h4>Contacts</h4>
          <ul className="contact-list">
            {contacts.map((c) => (
              <li key={c.id} onClick={() => openChat(c)}>
                <span className="contact-avatar">
                  <img className="avatar" src={avatarUrl(c.name, c.color)} alt={c.name} />
                  <i className="online-dot" />
                </span>
                {c.name}
              </li>
            ))}
          </ul>
          <h4>Trending Topics</h4>
          <ul>
            <li onClick={() => setQuery('cybersecurity')}>#CyberSecurityClass</li>
            <li onClick={() => setQuery('')}>#WebDev2026</li>
            <li onClick={() => setQuery('')}>#CapstoneProjects</li>
          </ul>
        </aside>
      </div>

      {deleteId !== null && (
        <div className="confirm-overlay" onClick={() => !deleting && setDeleteId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>Delete post?</h3>
            <p>This can&apos;t be undone.</p>
            <div className="confirm-actions">
              <button type="button" className="ghost" disabled={deleting} onClick={() => setDeleteId(null)}>Cancel</button>
              <button type="button" className="danger" disabled={deleting} onClick={confirmDelete}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareTarget && (
        <div className="confirm-overlay" onClick={closeShare}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>Share this post?</h3>
            <div className="share-preview">
              <strong>{shareTarget.user.name}</strong>
              <p>
                {(shareTarget.body || (shareTarget.media_url ? 'Shared a photo or video' : '')).slice(0, 140)}
              </p>
            </div>
            <textarea
              className="share-input"
              maxLength={2000}
              placeholder="Say something about this… (optional)"
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
            />
            <div className="confirm-actions">
              <button type="button" className="ghost" disabled={sharing} onClick={closeShare}>Cancel</button>
              <button type="button" className="primary" disabled={sharing} onClick={confirmShare}>
                {sharing ? 'Sharing…' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdToast onOpen={() => navigate('/sim/ad-landing')} />

      <div className="chat-dock">
        {chat && (
          <div className="chat-window">
            <div className="chat-head">
              <img className="avatar" src={avatarUrl(chat.name, chat.color)} alt={chat.name} />
              <span>{chat.name}</span>
              <button type="button" onClick={() => setChat(null)} aria-label="Close chat">&times;</button>
            </div>
            <div className="chat-body">
              {(chatLog[chat.id] || []).length === 0 && <div className="chat-empty">Say hi to {chat.name.split(' ')[0]}.</div>}
              {(chatLog[chat.id] || []).map((m, i) => <div className="chat-msg" key={i}>{m}</div>)}
            </div>
            <form className="chat-input" onSubmit={sendChat}>
              <input placeholder="Aa" value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} />
              <button type="submit" disabled={!chatDraft.trim()}>Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}