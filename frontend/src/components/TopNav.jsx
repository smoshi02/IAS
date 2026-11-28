import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  IconLogoMark, IconSearch, IconLogout, IconGrid, IconMessenger, IconChevronDown,
} from './Icons';
import NavMenu from './NavMenu';
import NotificationBell from './NotificationBell';
import { ChatsPanel } from './Messenger';
import { avatarOf } from '../utils/people';
import '../styles/search.css';

/* ---- navbar tab icons: outline normally, solid (filled blue via CSS) when active ---- */
const OUT = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
const SOLID = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'currentColor', stroke: 'none' };
const CUT = { stroke: 'var(--nav-bg, #fff)' };

const HOME_BODY = 'M12 2.9L3.2 9.9a1.2 1.2 0 0 0-.45.94V20a1.3 1.3 0 0 0 1.3 1.3h4.6a.6.6 0 0 0 .6-.6v-5.1a1.2 1.2 0 0 1 1.2-1.2h3.1a1.2 1.2 0 0 1 1.2 1.2v5.1a.6.6 0 0 0 .6.6h4.6a1.3 1.3 0 0 0 1.3-1.3v-9.16a1.2 1.2 0 0 0-.45-.94z';
const NavHome = ({ active }) => (active
  ? <svg {...SOLID}><path d={HOME_BODY} /></svg>
  : <svg {...OUT}><path d={HOME_BODY} /></svg>);

const NavReels = ({ active }) => (active
  ? (
    <svg {...SOLID}>
      <path
        fillRule="evenodd"
        d="M8 2.6h8A5.4 5.4 0 0 1 21.4 8v8a5.4 5.4 0 0 1-5.4 5.4H8A5.4 5.4 0 0 1 2.6 16V8A5.4 5.4 0 0 1 8 2.6zM10.1 11.1v5.8a.6.6 0 0 0 .9.5l4.9-2.9a.6.6 0 0 0 0-1l-4.9-2.9a.6.6 0 0 0-.9.5z"
      />
      <path d="M2.6 8.4h18.8" fill="none" style={CUT} strokeWidth="1.6" />
      <path d="M8.3 2.8l2.6 5.6M13.5 2.8l2.6 5.6" fill="none" style={CUT} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
  : (
    <svg {...OUT}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M3 8.6h18M8.4 3l2.5 5.6M13.6 3l2.5 5.6" />
      <path d="M10.4 12v5l4.2-2.5z" />
    </svg>
  ));

const NavFriends = ({ active }) => (active
  ? (
    <svg {...SOLID}>
      <circle cx="9.2" cy="7.6" r="3.6" />
      <path d="M2.6 19.6c0-3.6 2.7-6.2 6.6-6.2s6.6 2.6 6.6 6.2c0 .7-.5 1.2-1.2 1.2H3.8c-.7 0-1.2-.5-1.2-1.2z" />
      <circle cx="17.2" cy="8.6" r="2.7" />
      <path d="M17.4 13.2c2.6.1 4.5 1.9 4.5 4.5 0 .6-.4 1-1 1h-3.3c.1-.3.1-.6.1-1 0-1.9-.5-3.5-1.5-4.6.4 0 .8 0 1.2.1z" />
    </svg>
  )
  : (
    <svg {...OUT}>
      <circle cx="9.2" cy="7.8" r="3.3" />
      <path d="M3.4 19.3c.2-3.2 2.5-5.1 5.8-5.1s5.6 1.9 5.8 5.1z" />
      <path d="M15.6 5.4a2.9 2.9 0 1 1 .9 5.4" />
      <path d="M17.6 14.1c2.1.3 3.6 1.9 3.8 4.2" />
    </svg>
  ));

const NavStore = ({ active }) => (active
  ? (
    <svg {...SOLID}>
      <path d="M5.4 3.4h13.2a1 1 0 0 1 .96.72l1.7 5.5a2.9 2.9 0 0 1-5.5 1.3 2.9 2.9 0 0 1-5.5 0 2.9 2.9 0 0 1-5.5-1.3l1.7-5.5a1 1 0 0 1 .94-.72z" />
      <path
        fillRule="evenodd"
        d="M4.6 12.6a4.1 4.1 0 0 0 3.4-.8 4.1 4.1 0 0 0 8 0 4.1 4.1 0 0 0 3.4.8v7a1.2 1.2 0 0 1-1.2 1.2H5.8a1.2 1.2 0 0 1-1.2-1.2zM10 20.8v-4.6a.6.6 0 0 1 .6-.6h2.8a.6.6 0 0 1 .6.6v4.6z"
      />
    </svg>
  )
  : (
    <svg {...OUT}>
      <path d="M5.4 3.6h13.2l1.7 5.6a2.7 2.7 0 0 1-5.2 1.1 2.7 2.7 0 0 1-5.4 0 2.7 2.7 0 0 1-5.2-1.1z" />
      <path d="M4.7 11.7v7.9a1.2 1.2 0 0 0 1.2 1.2h12.2a1.2 1.2 0 0 0 1.2-1.2v-7.9" />
      <path d="M10 20.8v-4.4h4v4.4" />
    </svg>
  ));

const NavProfile = ({ active }) => (active
  ? (
    <svg {...SOLID}>
      <path
        fillRule="evenodd"
        d="M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2zM12 6.4a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4zM6.7 17.7c1.2-2 3.1-3.1 5.3-3.1s4.1 1.1 5.3 3.1A7.6 7.6 0 0 1 12 19.6a7.6 7.6 0 0 1-5.3-1.9z"
      />
    </svg>
  )
  : (
    <svg {...OUT}>
      <circle cx="12" cy="12" r="9.2" />
      <circle cx="12" cy="9.8" r="3" />
      <path d="M6.2 18.4c1.2-2.1 3.3-3.2 5.8-3.2s4.6 1.1 5.8 3.2" />
    </svg>
  ));

const SECTIONS = {
  feed: 'Home',
  friends: 'Friends',
  groups: 'Groups',
  saved: 'Saved',
  memories: 'Memories',
  photos: 'Photos',
};

// order + icons follow the reference: Home, Reels, Friends, Store, Profile
// ('profile' opens your profile page; Groups stay reachable from the grid Menu)
const NAV_TABS = [
  { key: 'feed', label: 'Home', Icon: NavHome },
  { key: 'memories', label: 'Memories', Icon: NavReels },
  { key: 'friends', label: 'Friends', Icon: NavFriends },
  { key: 'saved', label: 'Saved', Icon: NavStore },
  { key: 'profile', label: 'Profile', Icon: NavProfile },
];


/* Plain text — no highlighting of the matched part of `text` against `q`. */
export function Hl({ text }) {
  return String(text || '');
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
  const { pathname } = useLocation();
  const userFullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';
  const isActive = (key) => (key === 'profile' ? pathname === '/profile' : section === key);

  return (
    <nav className="home-nav">
      <div className="nav-left">
        <div className="nav-logo" title="Phishbook" onClick={onLogo}>
          <IconLogoMark />
        </div>
        <SearchBox query={query} onQuery={onQuery} onSearch={onSearch} navigate={navigate} />
      </div>

      <div className="nav-tabs">
        {NAV_TABS.map(({ key, label, Icon }) => {
          const active = isActive(key);
          return (
            <button
              key={key}
              type="button"
              title={label}
              className={`nav-tab ${active ? 'active' : ''}`}
              onClick={() => (key === 'profile' ? navigate('/profile') : onSection(key))}
            >
              <Icon active={active} />
              {key === 'friends' && notifs.pendingRequests > 0 && (
                <span className="nav-badge">{notifs.pendingRequests > 99 ? '99+' : notifs.pendingRequests}</span>
              )}
            </button>
          );
        })}
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