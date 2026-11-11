import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { IconLogoMark, IconSearch, IconBell, IconUsers, IconBookmark, IconClock, IconThumbsUp, IconComment, IconShare, IconLogout, IconPlus } from '../components/Icons';
import '../styles/home.css';

function avatarUrl(name, bg) {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=fff&bold=true&size=128`;
}

const stories = [
  { id: 1, name: 'Maya Santos', color: '2C6BED' },
  { id: 2, name: 'Jordan Cruz', color: '42B72A' },
  { id: 3, name: 'Priya Nair', color: 'F0902F' },
  { id: 4, name: 'Alex Rivera', color: '9b59b6' },
];

const initialPosts = [
  { id: 1, author: 'Maya Santos', color: '2C6BED', time: '2h', text: 'Finished my cybersecurity project presentation today!', likes: 24, liked: false, comments: ['Nice work!', 'Congrats Maya!'] },
  { id: 2, author: 'Jordan Cruz', color: '42B72A', time: '5h', text: 'Anyone else up late studying for the networks exam?', likes: 11, liked: false, comments: ['Same here 😅'.replace('😅', '')] },
  { id: 3, author: 'Priya Nair', color: 'F0902F', time: '1d', text: 'Great workshop on web app security this week.', likes: 42, liked: false, comments: [] },
];

const SECTIONS = {
  feed: 'Home',
  friends: 'Friends',
  groups: 'Groups',
  saved: 'Saved',
  memories: 'Memories',
};

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
    if (!text) return;
    const newPost = {
      id: Date.now(),
      author: userFullName,
      color: '2C6BED',
      time: 'Just now',
      text,
      likes: 0,
      liked: false,
      comments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    setComposerText('');
  };

  const visiblePosts = useMemo(() => {
    let list = posts;
    if (section === 'saved') list = [];
    if (section === 'friends' || section === 'groups' || section === 'memories') {
      // No backend data for these yet — show nothing rather than fake content.
      list = [];
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.text.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    }
    return list;
  }, [posts, section, query]);

  return (
    <div className="home-page">
      <nav className="home-nav">
        <div className="nav-logo" onClick={() => { setSection('feed'); navigate('/home'); }}>
          <IconLogoMark /> PHISHBOOK
        </div>
        <div className="nav-search">
          <IconSearch />
          <input
            placeholder="Search Phishbook"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="nav-links">
          <span style={{ position: 'relative' }} onClick={() => setShowNotifs((v) => !v)}>
            <IconBell />
            {showNotifs && (
              <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="notif-item">Jordan Cruz commented on your post.</div>
                <div className="notif-item">Priya Nair liked your post.</div>
                <div className="notif-item">You have 2 new friend suggestions.</div>
              </div>
            )}
          </span>
          <span className="nav-essential" onClick={() => navigate('/profile')}><IconUsers /></span>
          <button className="nav-logout" onClick={handleLogout}><IconLogout /> Logout</button>
        </div>
      </nav>

      <div className="home-body">
        <aside className="sidebar left">
          <div className="profile-chip" onClick={() => navigate('/profile')}>
            <img className="avatar" src={avatarUrl(userFullName, '2C6BED')} alt={userFullName} />
            <span>{userFullName}</span>
          </div>
          <ul>
            {Object.entries(SECTIONS).filter(([key]) => key !== 'feed').map(([key, label]) => (
              <li key={key} className={section === key ? 'active' : ''} onClick={() => setSection(key)}>
                {key === 'friends' && <IconUsers />}
                {key === 'groups' && <IconUsers />}
                {key === 'saved' && <IconBookmark />}
                {key === 'memories' && <IconClock />}
                {label}
              </li>
            ))}
          </ul>
        </aside>

        <main className="feed">
          <h2 className="feed-heading">{SECTIONS[section]}</h2>

          {section === 'feed' && (
            <div className="stories-row">
              <div className="story-card add">
                <IconPlus />
                <span>Add Story</span>
              </div>
              {stories.map((s) => (
                <div className="story-card" key={s.id} style={{ background: `linear-gradient(160deg, #${s.color}, #1C3FAE)` }}>
                  <img className="story-avatar" src={avatarUrl(s.name, s.color)} alt={s.name} />
                  {s.name.split(' ')[0]}
                </div>
              ))}
            </div>
          )}

          {section === 'feed' && (
            <form className="create-post" onSubmit={submitNewPost}>
              <img className="avatar" src={avatarUrl(userFullName, '2C6BED')} alt={userFullName} />
              <input
                placeholder={`What's on your mind, ${user?.first_name || ''}?`}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
              />
              <button type="submit" className="post-btn" disabled={!composerText.trim()}>Post</button>
            </form>
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
              <p className="post-text">{post.text}</p>
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
          <h4>Suggested Friends</h4>
          <ul>
            <li><img className="avatar" style={{ width: 28, height: 28 }} src={avatarUrl('Alex Rivera', '9b59b6')} alt="Alex Rivera" /> Alex Rivera</li>
            <li><img className="avatar" style={{ width: 28, height: 28 }} src={avatarUrl('Sam Oduya', 'e67e22')} alt="Sam Oduya" /> Sam Oduya</li>
            <li><img className="avatar" style={{ width: 28, height: 28 }} src={avatarUrl('Lin Zhao', '16a085')} alt="Lin Zhao" /> Lin Zhao</li>
          </ul>
          <h4>Trending Topics</h4>
          <ul>
            <li onClick={() => setQuery('cybersecurity')}>#CyberSecurityClass</li>
            <li onClick={() => setQuery('')}>#WebDev2026</li>
            <li onClick={() => setQuery('')}>#CapstoneProjects</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}