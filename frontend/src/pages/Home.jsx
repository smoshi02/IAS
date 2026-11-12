import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { IconLogoMark, IconSearch, IconBell, IconUsers, IconUser, IconHome, IconImage, IconBookmark, IconClock, IconThumbsUp, IconComment, IconShare, IconLogout, IconPlus } from '../components/Icons';
import '../styles/home.css';

function avatarUrl(name, bg) {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=fff&bold=true&size=128`;
}

const stories = [
  { id: 1, name: 'Maya Santos', color: '2C6BED' },
  { id: 2, name: 'Jordan Cruz', color: '42B72A' },
  { id: 3, name: 'Priya Nair', color: 'F0902F' },
];

const initialPosts = [
  { id: 1, author: 'Maya Santos', color: '2C6BED', time: '2h', text: 'Finished my cybersecurity project presentation today!', likes: 24, liked: false, comments: ['Nice work!', 'Congrats Maya!'], media: { color: '2C6BED' } },
  { id: 2, author: 'Jordan Cruz', color: '42B72A', time: '5h', text: 'Anyone else up late studying for the networks exam?', likes: 11, liked: false, comments: ['Same here 😅'.replace('😅', '')] },
  { id: 3, author: 'Priya Nair', color: 'F0902F', time: '1d', text: 'Great workshop on web app security this week.', likes: 42, liked: false, comments: [] },
];

const SECTIONS = {
  feed: 'Home',
  friends: 'Friends',
  groups: 'Groups',
  saved: 'Saved',
  memories: 'Memories',
  photos: 'Photos',
};

// Top tabs (icon-only) and left shortcuts
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

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState(initialPosts);
  const [section, setSection] = useState('feed');
  const [query, setQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState(null);
  const [chat, setChat] = useState(null);
  const [chatLog, setChatLog] = useState({});
  const [chatDraft, setChatDraft] = useState('');
  const fileRef = useRef(null);
  const composerRef = useRef(null);

  const userFullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) { /* ignore */ }
    logout();
    navigate('/login');
  };

  const toggleLike = (id) => {
    setPosts((prev) => prev.map((p) => p.id === id
      ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
      : p));
  };

  const toggleComments = (id) => {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const submitComment = (id) => {
    const text = (commentDraft[id] || '').trim();
    if (!text) return;
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, comments: [...p.comments, text] } : p));
    setCommentDraft((prev) => ({ ...prev, [id]: '' }));
  };

  const sharePost = async (post) => {
    const shareText = `${post.author}: ${post.text}`;
    try {
      await navigator.clipboard.writeText(shareText);
      alert('Post copied to clipboard.');
    } catch {
      alert(shareText);
    }
  };

  const submitNewPost = (e) => {
    e.preventDefault();
    const text = composerText.trim();
    if (!text && !composerImage) return;
    const newPost = {
      id: Date.now(),
      author: userFullName,
      color: '2C6BED',
      time: 'Just now',
      text,
      likes: 0,
      liked: false,
      comments: [],
      media: composerImage ? { src: composerImage } : null,
    };
    setPosts((prev) => [newPost, ...prev]);
    setComposerText('');
    setComposerImage(null);
  };

  const pickImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setComposerImage(URL.createObjectURL(file));
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
    // No backend data for the other sections yet — show nothing rather than fake content.
    if (section !== 'feed') list = [];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.text.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
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
                  <button type="button" title="Add photo" onClick={() => fileRef.current && fileRef.current.click()}><IconImage /></button>
                  <button type="button" title="Mention someone" onClick={() => insertSymbol('@')}><IconUsers /></button>
                  <button type="button" title="Add hashtag" onClick={() => insertSymbol('#')}>#</button>
                </div>
                <button type="submit" className="post-btn" disabled={!composerText.trim() && !composerImage}>Post</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
              {composerImage && (
                <div className="composer-preview">
                  <img src={composerImage} alt="Selected" />
                  <button type="button" onClick={() => setComposerImage(null)}>Remove</button>
                </div>
              )}
            </form>
          )}

          {section === 'feed' && (
            <div className="stories-row">
              <div className="story-card add">
                <IconPlus />
                <span>Add story</span>
              </div>
              {stories.map((s) => (
                <div className="story-card" key={s.id} style={{ background: `linear-gradient(160deg, #${s.color}, #1C3FAE)` }}>
                  <img className="story-avatar" src={avatarUrl(s.name, s.color)} alt={s.name} />
                  <IconImage className="story-glyph" />
                  <span className="story-label">{s.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}

          {visiblePosts.map((post) => (
            <div className="post-card" key={post.id}>
              <div className="post-header">
                <img className="avatar" src={avatarUrl(post.author, post.color)} alt={post.author} />
                <div>
                  <div className="post-author">{post.author}</div>
                  <div className="post-time">{post.time} &middot; Public</div>
                </div>
              </div>
              {post.text && <p className="post-text">{post.text}</p>}
              {post.media && (post.media.src
                ? <img className="post-media" src={post.media.src} alt="Post" />
                : (
                  <div className="post-media placeholder" style={{ background: `linear-gradient(160deg, #${post.media.color}, #1C3FAE)` }}>
                    <IconImage />
                  </div>
                ))}
              <div className="post-actions">
                <span onClick={() => toggleLike(post.id)} className={post.liked ? 'active-like' : ''}>
                  <IconThumbsUp /> Like ({post.likes})
                </span>
                <span onClick={() => toggleComments(post.id)}>
                  <IconComment /> Comment ({post.comments.length})
                </span>
                <span onClick={() => sharePost(post)}>
                  <IconShare /> Share
                </span>
              </div>

              {openComments[post.id] && (
                <div className="comment-section">
                  {post.comments.map((c, i) => (
                    <div className="comment-bubble" key={i}>{c}</div>
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
          ))}

          {visiblePosts.length === 0 && (
            <div className="empty-state">Nothing here yet.</div>
          )}
        </main>

        <aside className="sidebar right">
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
        <div className="chat-bubbles">
          {contacts.map((c) => (
            <button type="button" key={c.id} title={c.name} className={chat && chat.id === c.id ? 'active' : ''} onClick={() => openChat(c)}>
              <img src={avatarUrl(c.name, c.color)} alt={c.name} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}