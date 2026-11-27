import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TopNav, { Hl } from '../components/TopNav';
import useNotifications from '../hooks/useNotifications';
import useChats from '../hooks/useChats';
import { avatarOf, timeAgo } from '../utils/people';
import '../styles/home.css';
import '../styles/profile.css';
import '../styles/search.css';

const FILTERS = [
  ['all', 'All'],
  ['posts', 'Posts'],
  ['people', 'People'],
  ['photos', 'Photos'],
  ['videos', 'Videos'],
  ['groups', 'Groups'],
];

const ICONS = {
  all: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2 4v2h12V8H6zm0 4v2h8v-2H6z',
  posts: 'M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5L14 3.5zM7 12v2h10v-2H7zm0 4v2h7v-2H7z',
  people: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  photos: 'M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z',
  videos: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V4h-4z',
  groups: 'M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.51 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm16 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z',
};
const SIcon = ({ n }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d={ICONS[n]} /></svg>
);
const Caret = ({ up }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" style={up ? { transform: 'rotate(180deg)' } : undefined}>
    <path d="M7 10l5 5 5-5z" />
  </svg>
);

const DATES = [['any', 'Any date'], ['today', 'Today'], ['week', 'Past week'], ['month', 'Past month'], ['year', 'Past year']];
const FROMS = [['anyone', 'Anyone'], ['friends', 'Your friends'], ['me', 'You']];

function Switch({ on, onClick, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`sr-switch ${on ? 'on' : ''}`} onClick={onClick} />
  );
}

/* a collapsible filter row ("Date posted", "Posts from") */
function Drop({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = options.find(([k]) => k === value);
  return (
    <div className="sr-drop">
      <button type="button" className="sr-drop-h" onClick={() => setOpen((o) => !o)}>
        <span>{label}{value !== options[0][0] && <em>{current[1]}</em>}</span>
        <Caret up={open} />
      </button>
      {open && options.map(([k, l]) => (
        <button key={k} type="button" className={`sr-opt ${value === k ? 'on' : ''}`} onClick={() => onChange(k)}>
          <i className="sr-radio" />{l}
        </button>
      ))}
    </div>
  );
}

/* one person row, with a working friend button */
function PersonRow({ u, q, onChanged }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const rel = u.friendship;

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); } catch (e) { /* refetch shows the real state */ }
    await onChanged();
    setBusy(false);
  };

  let button = null;
  if (u.is_me) button = <span className="sr-you">You</span>;
  else if (rel.status === 'friends') button = <button type="button" className="fb-btn secondary" disabled>Friends</button>;
  else if (rel.status === 'sent') button = <button type="button" className="fb-btn secondary" disabled={busy} onClick={() => act(() => api.delete(`/friends/${rel.id}`))}>Cancel request</button>;
  else if (rel.status === 'received') button = <button type="button" className="fb-btn primary" disabled={busy} onClick={() => act(() => api.post(`/friends/${rel.id}/accept`))}>Confirm</button>;
  else button = <button type="button" className="fb-btn primary" disabled={busy} onClick={() => act(() => api.post(`/friends/request/${u.id}`))}>Add friend</button>;

  return (
    <div className="sr-person">
      <img src={avatarOf(u, 120)} alt="" onClick={() => navigate(`/profile/${u.id}`)} />
      <div className="sr-person-tx" onClick={() => navigate(`/profile/${u.id}`)}>
        <b><Hl text={u.name} q={q} /></b>
        <small>{u.bio ? <Hl text={u.bio} q={q} /> : 'Phishbook member'}</small>
      </div>
      {button}
    </div>
  );
}

/* one post (read-only) */
function PostResult({ post, q }) {
  const navigate = useNavigate();
  const go = () => navigate(`/profile/${post.user.id}`);
  return (
    <div className="pf-card pf-post sr-post">
      <div className="pf-post-head">
        <img src={avatarOf(post.user, 80)} alt="" style={{ cursor: 'pointer' }} onClick={go} />
        <div>
          <b style={{ cursor: 'pointer' }} onClick={go}><Hl text={post.user.name} q={q} /></b>
          <small>{timeAgo(post.created_at)} &middot; Public</small>
        </div>
      </div>
      {post.body && <p className="pf-post-body"><Hl text={post.body} q={q} /></p>}
      {post.media_url && (post.media_type === 'video'
        ? <video className="pf-post-media" src={post.media_url} controls />
        : <img className="pf-post-media" src={post.media_url} alt="Post" />)}
      {post.shared && (
        <div className="pf-shared">
          <b>{post.shared.user.name}</b>
          {post.shared.body && <p><Hl text={post.shared.body} q={q} /></p>}
          {post.shared.media_url && post.shared.media_type !== 'video' && <img src={post.shared.media_url} alt="" />}
        </div>
      )}
      <div className="pf-post-stats">
        <span>{post.likes_count} reaction{post.likes_count === 1 ? '' : 's'}</span>
        <span>{post.comments_count} comment{post.comments_count === 1 ? '' : 's'}</span>
        <span>{post.shares_count} share{post.shares_count === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}

export default function SearchResults() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const q = (sp.get('q') || '').trim();
  const type = FILTERS.some(([k]) => k === sp.get('type')) ? sp.get('type') : 'all';

  const [navQuery, setNavQuery] = useState(q);
  const [people, setPeople] = useState([]);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('any');
  const [from, setFrom] = useState('anyone');
  const notifs = useNotifications();
  const chats = useChats();
  const seq = useRef(0);

  useEffect(() => { setNavQuery(q); }, [q]);

  const setType = (t) => setSp(t === 'all' ? { q } : { q, type: t });

  const mediaFor = type === 'photos' ? 'image' : type === 'videos' ? 'video' : undefined;
  const wantPeople = type === 'all' || type === 'people';
  const wantPosts = type === 'all' || type === 'posts' || type === 'photos' || type === 'videos';
  const useFilters = type === 'all' || type === 'posts'; // date / author filters apply to these views

  const loadPeople = useCallback(async () => {
    if (!q || !wantPeople) { setPeople([]); return; }
    try {
      const res = await api.get('/search/people', { params: { q, limit: type === 'all' ? 5 : 30 } });
      setPeople(res.data.data);
    } catch (e) { setPeople([]); }
  }, [q, type, wantPeople]);

  const loadPosts = useCallback(async (pg = 1) => {
    if (!q || !wantPosts) { setPosts([]); setPage(1); setLastPage(1); return; }
    try {
      const res = await api.get('/posts', {
        params: {
          q,
          page: pg,
          media: mediaFor,
          since: useFilters && date !== 'any' ? date : undefined,
          from: useFilters && from !== 'anyone' ? from : undefined,
        },
      });
      setPosts((prev) => (pg === 1 ? res.data.data : [...prev, ...res.data.data]));
      setPage(res.data.current_page);
      setLastPage(res.data.last_page);
    } catch (e) { if (pg === 1) setPosts([]); }
  }, [q, wantPosts, mediaFor, useFilters, date, from]);

  useEffect(() => {
    const mine = ++seq.current;
    setLoading(true);
    setPeople([]); setPosts([]); setPage(1); setLastPage(1);
    Promise.all([loadPeople(), loadPosts(1)]).finally(() => { if (mine === seq.current) setLoading(false); });
  }, [loadPeople, loadPosts]);

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) { /* ignore */ }
    logout();
    navigate('/login');
  };

  const nothing = !loading && type !== 'groups' && people.length === 0 && (!wantPosts || posts.length === 0);

  const shownPeople = type === 'all' ? people.slice(0, 3) : people;
  const peopleBlock = shownPeople.length > 0 && (
    <div className="pf-card sr-card">
      <h3>People</h3>
      {shownPeople.map((u) => <PersonRow key={u.id} u={u} q={q} onChanged={loadPeople} />)}
      {type === 'all' && people.length > 3 && (
        <button type="button" className="sr-seeall" onClick={() => setType('people')}>See all</button>
      )}
    </div>
  );

  const postsBlock = (type === 'photos' || type === 'videos') ? (
    posts.length > 0 && (
      <div className="pf-card sr-grid">
        {posts.map((p) => (
          <div key={p.id} className="sr-tile">
            {type === 'photos'
              ? <a href={p.media_url} target="_blank" rel="noreferrer"><img src={p.media_url} alt="" /></a>
              : <video src={p.media_url} controls />}
            <small>{p.user.name}</small>
          </div>
        ))}
      </div>
    )
  ) : posts.map((p) => <PostResult key={p.id} post={p} q={q} />);

  const filterRow = (k, label) => (
    <React.Fragment key={k}>
      <button type="button" className={`sr-f ${type === k ? 'on' : ''}`} onClick={() => setType(k)}>
        <span className="sr-fi"><SIcon n={k} /></span>{label}
      </button>
      {type === k && (k === 'all' || k === 'posts') && (
        <div className="sr-sub">
          <div className="sr-trow">
            <span>Recent posts</span>
            <Switch label="Recent posts" on={date === 'week'} onClick={() => setDate(date === 'week' ? 'any' : 'week')} />
          </div>
          <Drop label="Date posted" options={DATES} value={date} onChange={setDate} />
          <Drop label="Posts from" options={FROMS} value={from} onChange={setFrom} />
        </div>
      )}
    </React.Fragment>
  );

  return (
    <div className="pf-page sr-page">
      <div className="home-page nav-only">
        <TopNav
          section=""
          onSection={(key) => navigate('/home', { state: { section: key } })}
          query={navQuery}
          onQuery={setNavQuery}
          notifs={notifs}
          chats={chats}
          onOpenChat={(peer) => navigate('/home', { state: { openChat: peer } })}
          onLogo={() => navigate('/home')}
          onLogout={handleLogout}
          navigate={navigate}
        />
      </div>

      <aside className="sr-side">
        <h2>Search results</h2>
        <hr />
        <h5>Filters</h5>
        {FILTERS.map(([k, label]) => filterRow(k, label))}
      </aside>

      <main className="sr-main">
        {!q && <div className="pf-card pf-muted center sr-pad">Search for people, posts, photos and videos.</div>}
        {q && loading && <div className="pf-card pf-muted center sr-pad">Searching…</div>}

        {q && !loading && type === 'groups' && (
          <div className="pf-card pf-muted center sr-pad">No groups to show. Groups aren&apos;t part of Phishbook yet.</div>
        )}

        {q && !loading && type !== 'groups' && (
          <>
            {wantPeople && peopleBlock}
            {wantPosts && postsBlock}
            {wantPosts && page < lastPage && (
              <button type="button" className="sr-seeall" onClick={() => loadPosts(page + 1)}>Load more</button>
            )}
          </>
        )}

        {q && nothing && (
          <div className="pf-card pf-muted center sr-pad">No results for &ldquo;{q}&rdquo;. Try different words or filters.</div>
        )}
      </main>
    </div>
  );
}