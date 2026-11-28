import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { IconImage } from '../components/Icons';
import SimAd from '../components/SimAd';
import Stories from '../components/Stories';
import ReactionIcon from '../components/ReactionIcons';
import PostMenu from '../components/PostMenu';
import PostMedia, { makeItems, revokeItems, MAX_FILES } from '../components/PostMedia';
import CreatePostModal from '../components/CreatePostModal';
import ShareModal from '../components/ShareModal';
import OtherPostMenu, { HiddenPost } from '../components/OtherPostMenu';
import TopNav from '../components/TopNav';
import * as Art from '../components/SideIcons';
import { NotificationToast } from '../components/NotificationBell';
import FriendsPanel from '../components/FriendsPanel';
import { ChatDock } from '../components/Messenger';
import useNotifications from '../hooks/useNotifications';
import useChats from '../hooks/useChats';
import { avatarOf, timeAgo } from '../utils/people';
import '../styles/home.css';

const POLL_MS = 4000;

// always visible, under the profile row
const SIDE_MAIN = [
  { key: 'metaai', label: 'Meta AI', Icon: Art.MetaAIIcon },
  { key: 'friends', label: 'Friends', Icon: Art.FriendsIcon },
  { key: 'marketplace', label: 'Marketplace', Icon: Art.MarketplaceIcon },
  { key: 'memories', label: 'Memories', Icon: Art.MemoriesIcon },
  { key: 'saved', label: 'Saved', Icon: Art.SavedIcon },
  { key: 'groups', label: 'Groups', Icon: Art.GroupsIcon },
  { key: 'reels', label: 'Reels', Icon: Art.ReelsIcon },
  { key: 'feeds', label: 'Feeds', Icon: Art.FeedsIcon },
  { key: 'events', label: 'Events', Icon: Art.EventsIcon },
];

// shown after pressing "See more"
const SIDE_MORE = [
  { key: 'ads', label: 'Ads Manager', Icon: Art.AdsManagerIcon },
  { key: 'birthdays', label: 'Birthdays', Icon: Art.BirthdaysIcon },
  { key: 'chatais', label: 'Chat with AIs', Icon: Art.ChatAIsIcon },
  { key: 'gaming', label: 'Gaming Video', Icon: Art.GamingVideoIcon },
  { key: 'messenger', label: 'Messenger', Icon: Art.MessengerIcon },
  { key: 'orders', label: 'Orders and payments', Icon: Art.OrdersIcon },
  { key: 'pages', label: 'Pages', Icon: Art.PagesIcon },
  { key: 'playgames', label: 'Play games', Icon: Art.PlayGamesIcon },
  { key: 'support', label: 'Support', Icon: Art.SupportIcon },
  { key: 'adactivity', label: 'Your Ad Activity', Icon: Art.AdActivityIcon },
];

const featured = [
  { id: 1, title: 'Capstone Showcase', sub: 'Dec 5 · Main Hall', color: '2C6BED' },
  { id: 2, title: 'Web Security Workshop', sub: 'Friday · Room 204', color: 'F0902F' },
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

const REACTIONS = [
  { key: 'like',  label: 'Like',  color: '#1877f2' },
  { key: 'love',  label: 'Love',  color: '#f33e58' },
  { key: 'care',  label: 'Care',  color: '#f7b125' },
  { key: 'haha',  label: 'Haha',  color: '#f7b125' },
  { key: 'wow',   label: 'Wow',   color: '#f7b125' },
  { key: 'sad',   label: 'Sad',   color: '#f7b125' },
  { key: 'angry', label: 'Angry', color: '#e9710f' },
];
const reactionOf = (k) => REACTIONS.find((r) => r.key === k);

const act = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconLikeO = () => (
  <svg {...act}>
    <rect x="2.6" y="10.6" width="4.9" height="10.8" rx="1.3" />
    <path d="M7.5 11.4L11.2 3.8a1.8 1.8 0 0 1 3.3 1L13.9 9.5h5.7a1.9 1.9 0 0 1 1.8 2.5l-1.8 7.3a1.9 1.9 0 0 1-1.8 1.4H7.5" />
  </svg>
);
const IconCommentO = () => (
  <svg {...act}><path d="M18.6 16.2L20.4 20.2L15.4 18.9A8.6 8.6 0 1 1 18.6 16.2Z" /></svg>
);
const IconForward = () => (
  <svg {...act}><path d="M21.2 9.7L14.4 3.6V7C8 7.3 3.4 11.2 2.6 17.8C5.6 13.9 9.6 12.8 14.4 12.9V16.3Z" /></svg>
);

function ReactionButton({ post, onReact }) {
  const mine = reactionOf(post.my_reaction);
  return (
    <div className="react-wrap">
      <div className="react-picker">
        {REACTIONS.map((r) => (
          <button type="button" key={r.key} title={r.label} onClick={() => onReact(post.id, r.key)}>
            <ReactionIcon type={r.key} size={42} />
          </button>
        ))}
      </div>
      <span
        className="pb-btn"
        onClick={() => onReact(post.id, post.my_reaction || 'like')}
        title={mine ? mine.label : 'Like'}
      >
        {mine ? <ReactionIcon type={mine.key} size={26} /> : <IconLikeO />}
        {post.likes_count > 0 && <em>{post.likes_count}</em>}
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
  const [hiddenIds, setHiddenIds] = useState({});
  const [showMore, setShowMore] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareText, setShareText] = useState('');
  const [sharing, setSharing] = useState(false);
  const loc = useLocation();
  const [section, setSection] = useState((loc.state && loc.state.section) || 'feed');
  const [query, setQuery] = useState((loc.state && loc.state.query) || '');
  const notifs = useNotifications();
  const [openComments, setOpenComments] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [composerText, setComposerText] = useState('');
  const [composerItems, setComposerItems] = useState([]); // [{ file, url, isVideo }]
  const [composerOpen, setComposerOpen] = useState(false);
  const chats = useChats();
  const [openChats, setOpenChats] = useState(loc.state && loc.state.openChat ? [loc.state.openChat] : []);
  const suppressUntil = useRef(0);
  const openRef = useRef({});
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

  useEffect(() => { openRef.current = openComments; }, [openComments]);

  // Live feed: every few seconds pull page 1 and merge it in, so reactions,
  // comment counts, new posts and deletions from other accounts show up
  // without a refresh. Open comment sections are refreshed too.
  const syncFeed = useCallback(async () => {
    if (Date.now() < suppressUntil.current) return;
    try {
      const { data } = await api.get('/posts', { params: { page: 1 } });
      const openIds = Object.keys(openRef.current).filter((k) => openRef.current[k]);
      const commentResults = await Promise.all(
        openIds.map((id) => api.get(`/posts/${id}/comments`).then((r) => [id, r.data]).catch(() => null)),
      );
      if (Date.now() < suppressUntil.current) return; // you just acted; don't overwrite it

      const fresh = data.data;
      setPosts((prev) => {
        const freshMap = new Map(fresh.map((p) => [p.id, p]));
        const minFresh = fresh.length ? Math.min(...fresh.map((p) => p.id)) : Infinity;
        const complete = data.last_page <= 1;
        const known = new Set(prev.map((p) => p.id));
        const kept = prev
          .filter((p) => freshMap.has(p.id) || !(complete || p.id >= minFresh)) // drop deleted posts
          .map((p) => freshMap.get(p.id) || p);                                  // refresh the rest
        const added = fresh.filter((p) => !known.has(p.id));                      // brand-new posts
        return added.length ? [...added, ...kept] : kept;
      });

      setCommentsMap((prev) => {
        const next = { ...prev };
        commentResults.forEach((r) => { if (r) next[r[0]] = r[1]; });
        return next;
      });
    } catch (e) {
      /* try again next tick */
    }
  }, []);

  useEffect(() => {
    const wake = () => { if (document.visibilityState === 'visible') syncFeed(); };
    const id = setInterval(wake, POLL_MS);
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
    };
  }, [syncFeed]);

  const holdSync = () => { suppressUntil.current = Date.now() + 1500; };

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) { /* ignore */ }
    logout();
    navigate('/login');
  };

  const updatePost = (id, patch) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const react = async (id, type = 'like') => {
    holdSync();
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
    holdSync();
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

  const confirmShare = async (text = '') => {
    if (!shareTarget) return;
    const post = shareTarget;
    setSharing(true);
    holdSync();
    try {
      const body = String(text || '').trim();
      const { data } = await api.post(`/posts/${post.id}/share`, body ? { body } : {});
      setPosts((prev) => [data, ...prev.map((p) => (p.id === post.id ? { ...p, shares_count: p.shares_count + 1 } : p))]);
      setShareTarget(null);
      setShareText('');
    } catch (e) { /* ignore */ } finally {
      setSharing(false);
    }
  };

  // "Your story" in the share dialog
  const shareToStory = async () => {
    if (!shareTarget) return false;
    holdSync();
    try {
      await api.post(`/posts/${shareTarget.id}/story`);
      window.dispatchEvent(new Event('stories:refresh'));
      setShareTarget(null);
      setShareText('');
      return true;
    } catch (e) {
      return false;
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    holdSync();
    try {
      await api.delete(`/posts/${deleteId}`);
      setPosts((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (e) { /* ignore */ } finally {
      setDeleting(false);
    }
  };
  const clearFiles = () => {
    revokeItems(composerItems);
    setComposerItems([]);
  };

  const removeFile = (i) => {
    const gone = composerItems[i];
    if (gone) URL.revokeObjectURL(gone.url);
    setComposerItems((prev) => prev.filter((_, k) => k !== i));
  };

  const submitNewPost = async (e) => {
    e.preventDefault();
    const text = composerText.trim();
    if ((!text && composerItems.length === 0) || posting) return;
    setPosting(true);
    setPostError('');
    holdSync();
    const fd = new FormData();
    if (text) fd.append('body', text);
    composerItems.forEach((it) => fd.append('media[]', it.file));
    try {
      const { data } = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts((prev) => [data, ...prev]);
      setComposerText('');
      clearFiles();
      setComposerOpen(false);
    } catch (err) {
      setPostError(err.response?.data?.message || 'Could not post. Check the file size/type.');
    } finally {
      setPosting(false);
    }
  };

  const pickFile = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const room = MAX_FILES - composerItems.length;
    setPostError(files.length > room ? `You can attach up to ${MAX_FILES} photos/videos per post.` : '');
    const add = makeItems(files.slice(0, Math.max(0, room)));
    setComposerItems((prev) => [...prev, ...add]);
  };

  const openPicker = (accept) => {
    if (!fileRef.current) return;
    fileRef.current.accept = accept;
    fileRef.current.click();
  };

  // the bar on the feed only launches the pop-up; photo/video buttons also open the file picker
  const openComposer = (accept) => {
    setComposerOpen(true);
    if (accept) openPicker(accept);
  };

  // open a chat window (max 2 docked at once)
  const openChat = (peer) => {
    setOpenChats((prev) => [...prev.filter((p) => p.id !== peer.id), { id: peer.id, name: peer.name, avatar: peer.avatar }].slice(-2));
  };
  const closeChat = (id) => setOpenChats((prev) => prev.filter((p) => p.id !== id));

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
      <TopNav
        section={section}
        onSection={setSection}
        query={query}
        onQuery={setQuery}
        notifs={notifs}
        chats={chats}
        onOpenChat={openChat}
        onLogo={() => { setSection('feed'); navigate('/home'); }}
        onLogout={handleLogout}
        navigate={navigate}
      />

      <div className="home-body">
        <aside className="sidebar left">
          <ul>
            <li onClick={() => navigate('/profile')}>
              <img className="side-avatar" src={avatarOf(user)} alt={userFullName} />
              {userFullName}
            </li>
            {(showMore ? [...SIDE_MAIN, ...SIDE_MORE] : SIDE_MAIN).map(({ key, label, Icon }) => (
              <li key={key} className={section === key ? 'active' : ''} onClick={() => setSection(key)}>
                <span className="side-icon"><Icon /></span>
                {label}
              </li>
            ))}
            <li className="side-toggle" onClick={() => setShowMore((v) => !v)}>
              <span className="side-icon side-chev">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={showMore ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {showMore ? 'See less' : 'See more'}
            </li>
          </ul>
        </aside>

        <main className="feed">
          {section === 'friends' && (
            <FriendsPanel query={query} tick={notifs.tick} onChange={notifs.refresh} />
          )}

          {section === 'feed' && (
            <div className="create-post">
              <div className="composer-row">
                <img className="avatar" src={avatarOf(user)} alt={userFullName} />
                <input
                  ref={composerRef}
                  readOnly
                  style={{ cursor: 'pointer' }}
                  placeholder={`What's on your mind, ${user?.first_name || ''}?`}
                  value={composerText}
                  onClick={() => openComposer()}
                />
                <div className="composer-tools">
                  <button type="button" title="Add video" onClick={() => openComposer('video/*')}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#f3425f" d="M4.5 5.5h9A2.5 2.5 0 0 1 16 8v8a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 2 16V8a2.5 2.5 0 0 1 2.5-2.5Zm12.8 4.2 4-2.3a.6.6 0 0 1 .9.5v8.2a.6.6 0 0 1-.9.5l-4-2.3Z" />
                      <circle cx="9" cy="12" r="2.6" fill="#fff" />
                      <circle cx="9" cy="12" r="1.1" fill="#f3425f" />
                    </svg>
                  </button>
                  <button type="button" title="Add photo" onClick={() => openComposer('image/*')}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="2.5" y="3.5" width="19" height="17" rx="3" fill="#45bd62" />
                      <circle cx="8.5" cy="9" r="1.9" fill="#fff" />
                      <path fill="#fff" d="m4.5 18 5-5.2a1 1 0 0 1 1.4 0l1.6 1.6 3.1-3.6a1 1 0 0 1 1.5 0L20 15.2V18Z" />
                    </svg>
                  </button>
                  <button type="button" title="Add emoji" onClick={() => openComposer()}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="#f7721e" strokeWidth="2.2" />
                      <circle cx="8.8" cy="10" r="1.3" fill="#f7721e" />
                      <circle cx="15.2" cy="10" r="1.3" fill="#f7721e" />
                      <path d="M7.8 14c1 1.8 2.5 2.6 4.2 2.6s3.2-.8 4.2-2.6" fill="none" stroke="#f7721e" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={pickFile} />
            </div>
          )}

          {composerOpen && (
            <CreatePostModal
              user={user}
              text={composerText}
              onText={setComposerText}
              items={composerItems}
              onRemove={removeFile}
              onClear={clearFiles}
              onPick={() => openPicker('image/*,video/*')}
              posting={posting}
              error={postError}
              onSubmit={submitNewPost}
              onClose={() => setComposerOpen(false)}
            />
          )}

          {section === 'feed' && <Stories />}

          {visiblePosts.map((post, idx) => (
            <React.Fragment key={post.id}>
            {section === 'feed' && idx === 1 && (
              <div className="feed-ad"><SimAd variant="default" /></div>
            )}
            {hiddenIds[post.id] && (
              <HiddenPost
                name={post.user.name}
                onUndo={() => setHiddenIds((h) => ({ ...h, [post.id]: false }))}
              />
            )}
            <div className="post-card" hidden={!!hiddenIds[post.id]}>
              <div className="post-header">
                <img className="avatar" src={avatarOf(post.user)} alt={post.user.name} />
                <div style={{ flex: 1 }}>
                  <div className="post-author link" onClick={() => navigate(`/profile/${post.user.id}`)}>{post.user.name}</div>
                  <div className="post-time">{timeAgo(post.created_at)} &middot; Public</div>
                </div>
                {user?.id === post.user.id ? (
                  <PostMenu onDelete={() => setDeleteId(post.id)} />
                ) : (
                  <OtherPostMenu onHide={() => setHiddenIds((h) => ({ ...h, [post.id]: true }))} />
                )}
              </div>
              {post.body && <p className="post-text">{post.body}</p>}
              <PostMedia post={post} onChange={(patch) => updatePost(post.id, patch)} />
              {post.shared && (
                <div className="shared-post">
                  <div className="post-header">
                    <img className="avatar" src={avatarOf(post.shared.user)} alt={post.shared.user.name} />
                    <div>
                      <div className="post-author">{post.shared.user.name}</div>
                      <div className="post-time">{timeAgo(post.shared.created_at)}</div>
                    </div>
                  </div>
                  {post.shared.body && <p className="post-text">{post.shared.body}</p>}
                  <PostMedia post={post.shared} />
                </div>
              )}

              <div className="post-bar">
                <div className="pb-left">
                  <ReactionButton post={post} onReact={react} />
                  <span className="pb-btn" title="Comment" onClick={() => toggleComments(post.id)}>
                    <IconCommentO />
                    {post.comments_count > 0 && <em>{post.comments_count}</em>}
                  </span>
                  <span className="pb-btn" title="Share" onClick={() => { setShareText(''); setShareTarget(post); }}>
                    <IconForward />
                  </span>
                </div>
                {post.likes_count > 0 && (
                  <div className="pb-stack">
                    {Object.keys(post.reactions || {}).map((k) => (
                      <span key={k} title={reactionOf(k)?.label}><ReactionIcon type={k} size={22} /></span>
                    ))}
                  </div>
                )}
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

          {!loading && visiblePosts.length === 0 && section !== 'friends' && (
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
          {chats.conversations.length === 0 ? (
            <div className="contact-empty">Add friends to start chatting.</div>
          ) : (
            <ul className="contact-list">
              {chats.conversations.map((c) => (
                <li key={c.user.id} onClick={() => openChat(c.user)}>
                  <span className="contact-avatar">
                    <img className="avatar" src={avatarOf(c.user)} alt={c.user.name} />
                    {c.online && <i className="online-dot" />}
                  </span>
                  {c.user.name}
                  {c.unread > 0 && <span className="contact-unread" />}
                </li>
              ))}
            </ul>
          )}
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
        <ShareModal
          post={shareTarget}
          user={user}
          conversations={chats.conversations}
          sharing={sharing}
          onShare={confirmShare}
          onShareStory={shareToStory}
          onSent={chats.refresh}
          onClose={closeShare}
        />
      )}

      <AdToast onOpen={() => window.open('/sim/ad-landing', '_blank', 'noopener,noreferrer')} />

      <NotificationToast
        toast={notifs.toast}
        onClose={notifs.dismissToast}
        onOpen={(n) => { if (!n.read) notifs.markRead(n.id); setSection('friends'); }}
      />

      <ChatDock peers={openChats} conversations={chats.conversations} onClose={closeChat} onSeen={chats.refresh} />
    </div>
  );
}