import React, { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  IconLogoMark, IconSearch, IconUsers, IconUser, IconHome, IconBookmark, IconClock,
  IconLogout, IconGrid, IconMessenger, IconChevronDown,
} from './Icons';
import NavMenu from './NavMenu';
import NotificationBell from './NotificationBell';
import { ChatsPanel } from './Messenger';
import { avatarOf } from '../utils/people';
import '../styles/search.css';

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


/* bold the part of `text` that matches `q` */
export function Hl({ text, q }) {
  const t = String(text || '');
  const needle = (q || '').trim();
  if (!needle) return t;
  const i = t.toLowerCase().indexOf(needle.toLowerCase());
  if (i < 0) return t;
  return (<>{t.slice(0, i)}<mark>{t.slice(i, i + needle.length)}</mark>{t.slice(i + needle.length)}</>);
}

/* the search input + live "as you type" suggestions (people and posts) */
function SearchBox({ query, onQuery, onSearch, navigate }) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrap = useRef(null);
  const seq = useRef(0);
  const q = query.trim();

  useEffect(() => {
    if (!q) { setPeople([]); setPosts([]); setLoading(false); return undefined; }
    const mine = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const [a, b] = await Promise.all([
          api.get('/search/people', { params: { q, limit: 5 } }),
          api.get('/posts', { params: { q } }),
        ]);
        if (mine !== seq.current) return;
        setPeople(a.data.data);
        setPosts(b.data.data.slice(0, 3));
      } catch (e) {
        if (mine === seq.current) { setPeople([]); setPosts([]); }
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const goSearch = (type) => {
    if (!q) return;
    setOpen(false);
    if (onSearch) onSearch(q, type);
    else navigate(`/search?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}`);
  };

  return (
    <div className="nav-search" ref={wrap}>
      <IconSearch />
      <input
        placeholder="Search Phishbook"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { onQuery && onQuery(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') goSearch();
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && q && (
        <div className="sb-pop">
          <button type="button" className="sb-row sb-all" onClick={() => goSearch()}>
            <span className="sb-ico"><IconSearch /></span>
            <span>Search for <b>{q}</b></span>
          </button>

          {people.length > 0 && <h6>People</h6>}
          {people.map((u) => (
            <button key={u.id} type="button" className="sb-row" onClick={() => { setOpen(false); navigate(`/profile/${u.id}`); }}>
              <img src={avatarOf(u, 80)} alt="" />
              <span className="sb-tx"><Hl text={u.name} q={q} /></span>
            </button>
          ))}

          {posts.length > 0 && <h6>Posts</h6>}
          {posts.map((p) => (
            <button key={p.id} type="button" className="sb-row" onClick={() => goSearch('posts')}>
              <img src={avatarOf(p.user, 80)} alt="" />
              <span className="sb-tx">
                <small>{p.user.name}</small>
                <Hl text={(p.body || (p.media_type === 'video' ? 'Shared a video' : 'Shared a photo')).slice(0, 80)} q={q} />
              </span>
            </button>
          ))}

          {!loading && people.length === 0 && posts.length === 0 && (
            <div className="sb-empty">No results for &ldquo;{q}&rdquo;</div>
          )}
          {loading && people.length === 0 && posts.length === 0 && <div className="sb-empty">Searching…</div>}
        </div>
      )}
    </div>
  );
}

/**
 * The top navbar shared by Home, Profile and Search.
 *  section / onSection  - which tab is highlighted and what a tab/menu click does
 *  query / onQuery      - the search box. Enter goes to /search?q=... (pass onSearch(q, type) to override)
 *  notifs / chats       - results of useNotifications() / useChats()
 *  onOpenChat(peer)     - a conversation was picked in the Messenger menu
 *  onLogo / onLogout    - logo click and "Log out"
 */
export default function TopNav({
  section = '', onSection, query = '', onQuery, onSearch,
  notifs, chats, onOpenChat, onLogo, onLogout, navigate,
}) {
  const { user } = useAuth();
  const userFullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';

  return (
    <nav className="home-nav">
      <div className="nav-left">
        <div className="nav-logo" title="Phishbook" onClick={onLogo}>
          <IconLogoMark />
        </div>
        <SearchBox query={query} onQuery={onQuery} onSearch={onSearch} navigate={navigate} />
      </div>

      <div className="nav-tabs">
        {NAV_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            title={label}
            className={`nav-tab ${section === key ? 'active' : ''}`}
            onClick={() => onSection(key)}
          >
            <Icon />
            {key === 'friends' && notifs.pendingRequests > 0 && (
              <span className="nav-badge">{notifs.pendingRequests > 99 ? '99+' : notifs.pendingRequests}</span>
            )}
          </button>
        ))}
      </div>

      <div className="nav-actions">
        <NavMenu title="Menu" trigger={<IconGrid />}>
          {(close) => (
            <>
              <div className="notif-panel-head"><h3>Menu</h3></div>
              <div className="menu-list">
                {Object.keys(SECTIONS).map((key) => (
                  <div key={key} className="menu-row" onClick={() => { onSection(key); close(); }}>
                    <span className="menu-ico">{SECTIONS[key].charAt(0)}</span>
                    {SECTIONS[key]}
                  </div>
                ))}
              </div>
            </>
          )}
        </NavMenu>

        <NavMenu
          title="Messenger"
          trigger={(
            <>
              <IconMessenger />
              {chats.totalUnread > 0 && (
                <span className="nav-badge">{chats.totalUnread > 99 ? '99+' : chats.totalUnread}</span>
              )}
            </>
          )}
        >
          {(close) => (
            <ChatsPanel
              conversations={chats.conversations}
              onOpen={(peer) => { onOpenChat(peer); close(); }}
            />
          )}
        </NavMenu>

        <NotificationBell notifs={notifs} onOpenFriends={() => onSection('friends')} />

        <NavMenu
          title="Account"
          className="nav-avatar-btn"
          trigger={(
            <>
              <img src={avatarOf(user)} alt={userFullName} />
              <i className="nav-chev"><IconChevronDown /></i>
            </>
          )}
        >
          {(close) => (
            <div className="menu-list">
              <div className="menu-row profile" onClick={() => { close(); navigate('/profile'); }}>
                <img src={avatarOf(user)} alt="" />
                <div>
                  <b>{userFullName}</b>
                  <small>See your profile</small>
                </div>
              </div>
              <div className="menu-row" onClick={() => { close(); onLogout(); }}>
                <span className="menu-ico"><IconLogout /></span>
                Log out
              </div>
            </div>
          )}
        </NavMenu>
      </div>
    </nav>
  );
}