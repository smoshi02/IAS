import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';
import useNotifications from '../hooks/useNotifications';
import useChats from '../hooks/useChats';
import { avatarOf, timeAgo } from '../utils/people';
import '../styles/home.css';
import '../styles/profile.css';

const POLL_MS = 5000;

/* ------------------------------ icons ------------------------------ */
const PATHS = {
  pencil: 'M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  cam: 'M9 3L7.2 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.2L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
  down: 'M7 10l5 5 5-5z',
  dots: 'M6 10a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z',
  pin: 'M16 9V4h1V2H7v2h1v5l-2 3v2h5.2v7h1.6v-7H18v-2l-2-3z',
  loc: 'M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  cake: 'M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 00-5.5-1.65l-.5.67-.5-.68A3 3 0 006 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2a1 1 0 110 2 1 1 0 010-2zM9 4a1 1 0 110 2 1 1 0 010-2z',
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  people: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  person: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  work: 'M20 6h-4V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zM10 4h4v2h-4V4z',
  school: 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
  star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  music: 'M12 3v10.55A4 4 0 1014 17V7h4V3h-6z',
  tv: 'M21 3H3a2 2 0 00-2 2v12a2 2 0 002 2h5v2h8v-2h5a2 2 0 002-2V5a2 2 0 00-2-2zm0 14H3V5h18v12z',
  film: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V4h-4z',
  game: 'M21 6H3a2 2 0 00-2 2v8a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
  trophy: 'M19 5h-2V3H7v2H5a2 2 0 00-2 2v1a5 5 0 004.1 4.9A5 5 0 0011 16.9V19H8v2h8v-2h-3v-2.1a5 5 0 003.9-3A5 5 0 0021 8V7a2 2 0 00-2-2zM5 8V7h2v3.8A3 3 0 015 8zm14 0a3 3 0 01-2 2.8V7h2v1z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
  link: 'M3.9 12a3.1 3.1 0 013.1-3.1h4V7H7a5 5 0 000 10h4v-1.9H7A3.1 3.1 0 013.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 010 6.2h-4V17h4a5 5 0 000-10z',
  mail: 'M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  phone: 'M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z',
  info: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  addc: 'M12 2a10 10 0 100 20 10 10 0 000-20zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
  search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  lock: 'M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6z',
  eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z',
  clock: 'M12 2a10 10 0 100 20 10 10 0 000-20zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z',
  list: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  grid: 'M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z',
  filter: 'M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z',
  gear: 'M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 00.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1a7.3 7.3 0 00-1.69-.98l-.38-2.65A.49.49 0 0014 2h-4a.49.49 0 00-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 00-.61.22l-2 3.46a.5.5 0 00.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 00-.12.64l2 3.46c.13.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46a.5.5 0 00-.12-.64l-2.11-1.65zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z',
};
const Ic = ({ n, s = 20 }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor" aria-hidden="true"><path d={PATHS[n]} /></svg>
);

/* ------------------------------ config ------------------------------ */
const TABS = [['all', 'All'], ['about', 'About'], ['friends', 'Friends'], ['photos', 'Photos'], ['reels', 'Reels']];
const MORE = [['checkins', 'Check-ins'], ['events', 'Events'], ['reviews', 'Reviews given'], ['groups', 'Groups']];
const ABOUT = [
  ['intro', 'Intro'], ['personal', 'Personal details'], ['work', 'Work'], ['education', 'Education'],
  ['hobbies', 'Hobbies'], ['interests', 'Interests'], ['travel', 'Travel'], ['links', 'Links'],
  ['contact', 'Contact info'], ['names', 'Names'], ['you', 'Details about you'],
];
const MENU = [
  { title: 'Profile mode', items: [['eye', 'Turn on professional mode']] },
  { title: 'Profile content', items: [['star', 'Edit highlights'], ['clock', 'Activity log'], ['list', 'Archive'], ['film', 'Story archive'], ['pencil', 'Review posts and tags'], ['search', 'Search']] },
  { title: 'Privacy', items: [['gear', 'Profile and tagging settings'], ['lock', 'Lock profile'], ['info', 'Privacy Center'], ['eye', 'View as']] },
];

/* ------------------------------ helpers ------------------------------ */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return [open, setOpen, ref];
}

function PhotoModal({ file, kind, busy, error, onCancel, onSave }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <div className="confirm-overlay" onClick={() => !busy && onCancel()}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{kind === 'avatar' ? 'Update profile picture' : 'Update cover photo'}</h3>
        <div className={`pf-preview ${kind}`}>{url && <img src={url} alt="Preview" />}</div>
        {error && <div className="post-error" style={{ margin: '0 16px' }}>{error}</div>}
        <div className="pf-actions">
          <button type="button" className="fb-btn secondary" disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="button" className="fb-btn primary" disabled={busy} onClick={onSave}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function ProfilePost({ post }) {
  return (
    <div className="pf-card pf-post">
      <div className="pf-post-head">
        <img src={avatarOf(post.user, 80)} alt="" />
        <div>
          <b>{post.user.name}</b>
          <small>{timeAgo(post.created_at)} &middot; Public</small>
        </div>
      </div>
      {post.body && <p className="pf-post-body">{post.body}</p>}
      {post.media_url && (post.media_type === 'video'
        ? <video className="pf-post-media" src={post.media_url} controls />
        : <img className="pf-post-media" src={post.media_url} alt="Post" />)}
      {post.shared && (
        <div className="pf-shared">
          <b>{post.shared.user.name}</b>
          {post.shared.body && <p>{post.shared.body}</p>}
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

/* one row in About: icon + value (or placeholder) + optional pencil */
function Field({ icon, label, sub, value, isMe, onEdit }) {
  if (!value && !isMe) return null;
  return (
    <div className="pr-field">
      <span className="pr-field-ic"><Ic n={icon} s={22} /></span>
      <div className="pr-field-tx">
        {value
          ? (<><b>{value}</b><small>{sub || label}</small></>)
          : <span className="pr-ph">{label}</span>}
      </div>
      {isMe && <button type="button" className="pr-round" title="Edit" onClick={onEdit}><Ic n="pencil" s={16} /></button>}
    </div>
  );
}
const Group = ({ title, children }) => (
  <div className="pr-group">{title && <h4>{title}</h4>}{children}</div>
);

function AboutPanel({ section, p, isMe, details, editBio, soon }) {
  const f = (icon, label, o = {}) => <Field icon={icon} label={label} isMe={isMe} onEdit={soon} {...o} />;
  const real = { intro: !!p.bio, personal: true, names: true, contact: !!details, you: !!p.bio };
  const title = (ABOUT.find(([k]) => k === section) || [])[1];
  const joined = new Date(p.joined_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

  if (!isMe && !real[section]) {
    return <div className="pr-empty">No {String(title).toLowerCase()} to show</div>;
  }

  switch (section) {
    case 'personal':
      return (
        <>
          <Group title="Location">{f('loc', 'Current city or town')}</Group>
          <Group title="Hometown">{f('home', 'Hometown')}</Group>
          <Group title="Birthday">{f('cake', 'Birth date')}</Group>
          <Group title="Status">{f('heart', 'Relationship status')}</Group>
          <Group title="Family members">{f('people', 'Family')}</Group>
          <Group title="Gender">{f('person', 'Gender')}</Group>
          <Group title="Pronouns">{f('person', 'Pronouns')}</Group>
          <Group title="Languages">{f('info', 'Languages')}</Group>
          <Group title="Joined">{f('clock', 'Joined', { value: joined, sub: 'Member since', isMe: false })}</Group>
        </>
      );
    case 'work': return <Group title="Work">{f('work', 'Work experience')}</Group>;
    case 'education': return <Group title="Education">{f('school', 'Education')}</Group>;
    case 'hobbies': return <Group title="Hobbies">{f('star', 'Hobbies')}</Group>;
    case 'interests':
      return (
        <>
          <Group title="Music">{f('music', 'Music')}</Group>
          <Group title="TV shows">{f('tv', 'TV shows')}</Group>
          <Group title="Movies">{f('film', 'Movies')}</Group>
          <Group title="Games">{f('game', 'Games')}</Group>
          <Group title="Sports teams and athletes">{f('trophy', 'Sports teams and athletes')}</Group>
        </>
      );
    case 'travel': return <Group title="Travel">{f('plane', "Places you've been")}</Group>;
    case 'links':
      return (
        <Group title="Links">
          <p className="pr-note">Add up to 10 links.</p>
          {f('link', 'Websites, blogs, portfolios')}
        </Group>
      );
    case 'contact':
      return (
        <Group title="Contact info">
          {details && f('mail', 'Email', { value: details.email, sub: 'Email', isMe: false })}
          {details && f('phone', 'Mobile', { value: details.mobile_number, sub: 'Mobile', isMe: false })}
          {details && f('person', 'Username', { value: details.username && `@${details.username}`, sub: 'Username', isMe: false })}
        </Group>
      );
    case 'names':
      return (
        <>
          <Group title="Name">{f('person', 'Name', { value: p.name, sub: 'Full name', isMe: false })}</Group>
          <Group title="Other names">{f('person', 'Nickname, birth name…')}</Group>
        </>
      );
    case 'you':
      return (
        <>
          <Group title="About you">{f('info', 'Write some details about yourself', { value: p.bio, sub: 'Bio', onEdit: editBio })}</Group>
          <Group title="Favorite quotes">{f('addc', 'Add your favorite quotations')}</Group>
        </>
      );
    default: // intro
      return (
        <>
          <Group title="Bio">{f('info', 'About you', { value: p.bio, sub: 'Bio', onEdit: editBio })}</Group>
          <Group title="Pinned details">{f('pin', 'Pinned details')}</Group>
        </>
      );
  }
}

/* ============================== page ============================== */
export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const targetId = id ? Number(id) : user.id;

  // the address bar is the source of truth: /profile?tab=about&section=work
  const tab = sp.get('tab') || 'all';
  const section = sp.get('section') || 'intro';
  const go = (t, s) => {
    const q = {};
    if (t && t !== 'all') q.tab = t;
    if (s && s !== 'intro') q.section = s;
    setSp(q);
    window.scrollTo({ top: 0 });
  };

  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [view, setView] = useState('list');
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [unfriendAsk, setUnfriendAsk] = useState(false);
  const [composer, setComposer] = useState('');
  const [cFile, setCFile] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState('');
  const [navQuery, setNavQuery] = useState('');
  const [fSub, setFSub] = useState('all');
  const [fQuery, setFQuery] = useState('');
  const [rSub, setRSub] = useState('mine');
  const [toast, setToast] = useState('');
  const [manageOpen, setManageOpen] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pr_hidden') || '[]'); } catch (e) { return []; }
  });
  const [moreOpen, setMoreOpen, moreRef] = useDropdown();
  const [menuOpen, setMenuOpen, menuRef] = useDropdown();
  const [caretOpen, setCaretOpen, caretRef] = useDropdown();
  const notifs = useNotifications();
  const chats = useChats();

  const pagesRef = useRef(1);
  const avatarInput = useRef(null);
  const coverInput = useRef(null);
  const postInput = useRef(null);
  const composerInput = useRef(null);

  const soon = () => setToast("This option isn't available yet.");
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleSection = (key) => {
    const next = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
    setHidden(next);
    try { localStorage.setItem('pr_hidden', JSON.stringify(next)); } catch (e) { /* ignore */ }
  };

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get(`/users/${targetId}/profile`);
      setData(res.data);
      setNotFound(false);
    } catch (e) {
      if (e.response && e.response.status === 404) setNotFound(true);
    }
  }, [targetId]);

  const loadPosts = useCallback(async (pg = 1) => {
    if (pg === 1 && pagesRef.current > 1) return;
    try {
      const res = await api.get('/posts', { params: { page: pg, user_id: targetId } });
      setPosts((prev) => (pg === 1 ? res.data.data : [...prev, ...res.data.data]));
      setPage(res.data.current_page);
      setLastPage(res.data.last_page);
      pagesRef.current = res.data.current_page;
    } catch (e) { /* next tick */ }
  }, [targetId]);

  useEffect(() => {
    setData(null); setNotFound(false); setPosts([]); setPage(1); setLastPage(1);
    pagesRef.current = 1; setFSub('all'); setFQuery(''); setView('list');
  }, [targetId]);

  useEffect(() => {
    loadProfile();
    loadPosts(1);
    const tick = () => { if (document.visibilityState === 'visible') { loadProfile(); loadPosts(1); } };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [loadProfile, loadPosts]);

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) { /* ignore */ }
    logout();
    navigate('/login');
  };

  const choose = (kind) => (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) { setSaveErr(''); setEditOpen(false); setPending({ file, kind }); }
  };

  const savePhoto = async () => {
    setSaving(true); setSaveErr('');
    const fd = new FormData();
    fd.append('photo', pending.file);
    try {
      const res = await api.post(pending.kind === 'avatar' ? '/profile/avatar' : '/profile/cover', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar_url: res.data.avatar, cover_url: res.data.cover });
      setPending(null);
      await loadProfile();
    } catch (e) {
      setSaveErr(e.response?.data?.message || 'Could not upload. Check the file size/type.');
    } finally { setSaving(false); }
  };

  const openEdit = () => { setBioDraft((data && data.user.bio) || ''); setEditOpen(true); };
  const saveBio = async () => {
    try {
      await api.patch('/profile', { bio: bioDraft });
      setEditOpen(false);
      await loadProfile();
    } catch (e) { /* ignore */ }
  };

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); } catch (e) { /* reload shows the real state */ }
    await loadProfile();
    setBusy(false);
  };

  const submitPost = async (e) => {
    e.preventDefault();
    const text = composer.trim();
    if ((!text && !cFile) || posting) return;
    setPosting(true); setPostErr('');
    const fd = new FormData();
    if (text) fd.append('body', text);
    if (cFile) fd.append('media', cFile);
    try {
      const res = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts((prev) => [res.data, ...prev]);
      setComposer(''); setCFile(null);
      loadProfile();
    } catch (er) {
      setPostErr(er.response?.data?.message || 'Could not post. Check the file size/type.');
    } finally { setPosting(false); }
  };

  const openPicker = (accept) => {
    if (!postInput.current) return;
    postInput.current.accept = accept;
    postInput.current.click();
  };
  const startLifeUpdate = () => {
    setComposer((t) => t || 'Life update: ');
    if (composerInput.current) composerInput.current.focus();
  };

  const topBar = (
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
  );

  if (notFound) {
    return <div className="pf-page">{topBar}<div className="pf-missing">This profile isn&apos;t available.</div></div>;
  }
  if (!data) {
    return (
      <div className="pf-page">
        {topBar}
        <div className="pr-wrap pr-skel-wrap">
          <div className="pr-skel" style={{ height: 300 }} />
          <div className="pr-skel" style={{ height: 90, marginTop: 16 }} />
          <div className="pr-skel" style={{ height: 240, marginTop: 16 }} />
        </div>
      </div>
    );
  }

  const p = data.user;
  const isMe = data.is_me;
  const rel = data.friendship;
  const visibleMore = MORE.filter(([k]) => !hidden.includes(k));
  const moreActive = MORE.some(([k]) => k === tab);

  const friendButtons = () => {
    if (isMe) {
      return (
        <>
          <button type="button" className="fb-btn primary" onClick={() => navigate('/home')}><Ic n="plus" s={16} /> Add to story</button>
          <button type="button" className="fb-btn secondary" onClick={openEdit}><Ic n="pencil" s={16} /> Edit profile</button>
          <div className="pr-pop-wrap" ref={caretRef}>
            <button type="button" className="fb-btn secondary pr-sq" aria-label="More" onClick={() => setCaretOpen((o) => !o)}><Ic n="down" s={18} /></button>
            {caretOpen && (
              <div className="pr-pop right">
                <button type="button" className="pr-pop-row" onClick={() => { setCaretOpen(false); soon(); }}><Ic n="eye" s={20} /> View as</button>
                <button type="button" className="pr-pop-row" onClick={() => { setCaretOpen(false); soon(); }}><Ic n="lock" s={20} /> Lock profile</button>
              </div>
            )}
          </div>
        </>
      );
    }
    const message = (
      <button type="button" className="fb-btn secondary" onClick={() => navigate('/home', { state: { openChat: { id: p.id, name: p.name, avatar: p.avatar } } })}>Message</button>
    );
    if (rel.status === 'friends') {
      return (
        <>
          <button type="button" className="fb-btn secondary" disabled={busy} onClick={() => setUnfriendAsk(true)}>&#10003; Friends</button>
          {message}
        </>
      );
    }
    if (rel.status === 'sent') {
      return (
        <>
          <button type="button" className="fb-btn secondary" disabled={busy} onClick={() => act(() => api.delete(`/friends/${rel.id}`))}>Cancel request</button>
          {message}
        </>
      );
    }
    if (rel.status === 'received') {
      return (
        <>
          <button type="button" className="fb-btn primary" disabled={busy} onClick={() => act(() => api.post(`/friends/${rel.id}/accept`))}>Confirm</button>
          <button type="button" className="fb-btn secondary" disabled={busy} onClick={() => act(() => api.delete(`/friends/${rel.id}`))}>Delete</button>
        </>
      );
    }
    return (
      <>
        <button type="button" className="fb-btn primary" disabled={busy} onClick={() => act(() => api.post(`/friends/request/${p.id}`))}><Ic n="plus" s={16} /> Add friend</button>
        {message}
      </>
    );
  };

  /* ----- pieces of the "All" tab ----- */
  const detailRows = (
    <>
      <div className="pr-mini-row"><Ic n="person" s={20} /> <span>{p.name}</span></div>
      <div className="pr-mini-row"><Ic n="clock" s={20} /> <span>Joined {new Date(p.joined_at).toLocaleDateString([], { month: 'long', year: 'numeric' })}</span></div>
      {p.bio && <div className="pr-mini-row"><Ic n="info" s={20} /> <span>{p.bio}</span></div>}
    </>
  );

  const FriendsCard = (
    <div className="pf-card">
      <div className="pf-card-title">
        <h3>Friends</h3>
        <button type="button" onClick={() => go('friends')}>See all friends</button>
      </div>
      <p className="pr-count">{data.friends_count} friend{data.friends_count === 1 ? '' : 's'}</p>
      {data.friends.length === 0
        ? <p className="pf-muted">No friends yet.</p>
        : (
          <div className="pf-grid3 people">
            {data.friends.slice(0, 9).map((fr) => (
              <div key={fr.id} className="pf-mini" onClick={() => navigate(`/profile/${fr.id}`)}>
                <img src={avatarOf(fr, 160)} alt="" />
                <span>{fr.name}</span>
              </div>
            ))}
          </div>
        )}
    </div>
  );

  const PhotosCard = (
    <div className="pf-card">
      <div className="pf-card-title">
        <h3>Photos</h3>
        <button type="button" onClick={() => go('photos')}>See all photos</button>
      </div>
      {data.photos.length === 0
        ? <p className="pf-muted">No photos yet.</p>
        : <div className="pf-grid3">{data.photos.slice(0, 9).map((ph) => <img key={ph.id} src={ph.url} alt="" />)}</div>}
    </div>
  );

  const HighlightsCard = (
    <div className="pf-card">
      <h3>Highlights</h3>
      {data.photos[0] && (
        <div className="pr-hl"><img src={data.photos[0].url} alt="" /><span>{data.photos.length}</span></div>
      )}
      {isMe
        ? <button type="button" className="fb-btn secondary block" onClick={soon}>Edit highlights</button>
        : !data.photos[0] && <p className="pf-muted">No highlights yet.</p>}
    </div>
  );

  const allTab = (
    <div className="pr-cols">
      <aside className="pr-left">
        <div className="pf-card">
          <div className="pf-card-title">
            <h3>Personal details</h3>
            {isMe && <button type="button" className="pr-round" title="Edit" onClick={() => go('about', 'personal')}><Ic n="pencil" s={16} /></button>}
          </div>
          {detailRows}
        </div>
        {HighlightsCard}
        {FriendsCard}
        {PhotosCard}
      </aside>

      <section className="pr-right">
        {isMe && (
          <form className="pf-card pf-composer" onSubmit={submitPost}>
            <div className="pf-composer-row">
              <img src={avatarOf(user, 80)} alt="" />
              <input ref={composerInput} placeholder="What's on your mind?" value={composer} onChange={(e) => setComposer(e.target.value)} />
            </div>
            {cFile && (
              <div className="pf-attach">{cFile.name}<button type="button" onClick={() => setCFile(null)}>Remove</button></div>
            )}
            {postErr && <div className="post-error">{postErr}</div>}
            <div className="pf-composer-foot">
              <button type="button" className="pf-act" onClick={() => openPicker('video/*')}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#f3425f" d="M4.5 5.5h9A2.5 2.5 0 0 1 16 8v8a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 2 16V8a2.5 2.5 0 0 1 2.5-2.5Zm12.8 4.2 4-2.3a.6.6 0 0 1 .9.5v8.2a.6.6 0 0 1-.9.5l-4-2.3Z" />
                  <circle cx="9" cy="12" r="2.6" fill="#fff" /><circle cx="9" cy="12" r="1.1" fill="#f3425f" />
                </svg>
                Live video
              </button>
              <button type="button" className="pf-act" onClick={() => openPicker('image/*,video/*')}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2.5" y="3.5" width="19" height="17" rx="3" fill="#45bd62" />
                  <circle cx="8.5" cy="9" r="1.9" fill="#fff" />
                  <path fill="#fff" d="m4.5 18 5-5.2a1 1 0 0 1 1.4 0l1.6 1.6 3.1-3.6a1 1 0 0 1 1.5 0L20 15.2V18Z" />
                </svg>
                Photo/video
              </button>
              <button type="button" className="pf-act" onClick={startLifeUpdate}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 3v18" stroke="#1b9be8" strokeWidth="2.2" strokeLinecap="round" />
                  <path fill="#1b9be8" d="M7 4.5c2.800-1.500 4.700 1.500 7.800 0 1.700-.8 3.200-.8 4.700-.2v9.200c-1.500-.6-3-.6-4.700.2-3.100 1.500-5-1.500-7.800 0z" />
                </svg>
                Life update
              </button>
              <input
                ref={postInput} type="file" accept="image/*,video/*" hidden
                onChange={(e) => { const fl = e.target.files && e.target.files[0]; e.target.value = ''; if (fl) setCFile(fl); }}
              />
            </div>
            {(composer.trim() || cFile) && (
              <button type="submit" className="fb-btn primary pf-post-submit" disabled={posting}>{posting ? 'Posting…' : 'Post'}</button>
            )}
          </form>
        )}

        <div className="pf-card pr-posts-head">
          <div className="pr-posts-top">
            <h3>Posts</h3>
            <div className="pr-posts-btns">
              <button type="button" className="fb-btn secondary" onClick={soon}><Ic n="filter" s={16} /> Filters</button>
              {isMe && <button type="button" className="fb-btn secondary" onClick={soon}><Ic n="gear" s={16} /> Manage posts</button>}
            </div>
          </div>
          <div className="pr-seg">
            <button type="button" className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><Ic n="list" s={18} /> List view</button>
            <button type="button" className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}><Ic n="grid" s={18} /> Grid view</button>
          </div>
        </div>

        {posts.length === 0 && <div className="pf-card pf-muted center">No posts to show.</div>}
        {view === 'list' && posts.map((post) => <ProfilePost key={post.id} post={post} />)}
        {view === 'grid' && posts.length > 0 && (
          <div className="pf-card pr-postgrid">
            {posts.map((post) => (
              <div key={post.id} className="pr-gtile">
                {post.media_url && post.media_type !== 'video' && <img src={post.media_url} alt="" />}
                {post.media_url && post.media_type === 'video' && <video src={post.media_url} muted />}
                {!post.media_url && <p>{post.body}</p>}
              </div>
            ))}
          </div>
        )}
        {page < lastPage && (
          <button type="button" className="fb-btn secondary block" onClick={() => loadPosts(page + 1)}>Load more</button>
        )}
      </section>
    </div>
  );

  /* ----- About tab ----- */
  const aboutTab = (
    <>
      <div className="pf-card pr-about">
        <nav className="pr-about-nav">
          <h3>About</h3>
          {ABOUT.map(([k, label]) => (
            <button key={k} type="button" className={section === k ? 'on' : ''} onClick={() => go('about', k)}>{label}</button>
          ))}
        </nav>
        <div className="pr-about-body">
          <AboutPanel section={section} p={p} isMe={isMe} details={data.me_details} editBio={openEdit} soon={soon} />
        </div>
      </div>
      {FriendsListCard()}
    </>
  );

  /* ----- Friends list card (used on the Friends tab and under About) ----- */
  function FriendsListCard() {
    const q = fQuery.trim().toLowerCase();
    let list = data.friends.slice();
    if (fSub === 'all') list.sort((a, b) => a.name.localeCompare(b.name));
    if (fSub === 'birthdays' || fSub === 'following') list = [];
    if (q) list = list.filter((fr) => fr.name.toLowerCase().includes(q));
    const subs = [['all', 'All friends'], ['recent', 'Recently Added'], ['birthdays', 'Birthdays'], ['following', 'Following']];
    return (
      <div className="pf-card pr-friends">
        <div className="pr-friends-top">
          <h3>Friends</h3>
          <div className="pr-friends-tools">
            {tab === 'friends' && (
              <label className="pr-search"><Ic n="search" s={16} /><input placeholder="Search" value={fQuery} onChange={(e) => setFQuery(e.target.value)} /></label>
            )}
            {isMe && <button type="button" className="pr-link" onClick={() => navigate('/home', { state: { section: 'friends' } })}>Friend requests</button>}
            <button type="button" className="pr-link" onClick={() => navigate('/home', { state: { section: 'friends' } })}>Find Friends</button>
          </div>
        </div>
        <div className="pr-subtabs">
          {subs.map(([k, label]) => (
            <button key={k} type="button" className={fSub === k ? 'on' : ''} onClick={() => setFSub(k)}>{label}</button>
          ))}
        </div>
        {list.length === 0
          ? <p className="pf-muted center pr-pad">{q ? 'No friends match your search.' : 'No friends to show.'}</p>
          : (
            <div className="pr-flist">
              {list.map((fr) => (
                <div key={fr.id} className="pr-frow" onClick={() => navigate(`/profile/${fr.id}`)}>
                  <img src={avatarOf(fr, 120)} alt="" />
                  <b>{fr.name}</b>
                </div>
              ))}
            </div>
          )}
      </div>
    );
  }

  const emptyCard = (title, msg) => (
    <div className="pf-card">
      <div className="pf-card-title"><h3>{title}</h3></div>
      <p className="pf-muted center pr-pad">{msg}</p>
    </div>
  );

  const reelsTab = (
    <>
      <div className="pf-card">
        <div className="pf-card-title">
          <h3>Reels</h3>
          {isMe && <button type="button" onClick={soon}>Create reel</button>}
        </div>
        <div className="pr-subtabs">
          <button type="button" className={rSub === 'mine' ? 'on' : ''} onClick={() => setRSub('mine')}>{isMe ? 'Your reels' : 'Reels'}</button>
          {isMe && <button type="button" className={rSub === 'saved' ? 'on' : ''} onClick={() => setRSub('saved')}>Saved reels</button>}
        </div>
        <p className="pr-reels-empty">{rSub === 'saved' ? "You haven't saved any reels yet." : isMe ? "You haven't created any reels yet." : 'No reels to show.'}</p>
      </div>
      {emptyCard('Check-ins', 'No check-ins to show.')}
    </>
  );

  const photosTab = (
    <div className="pf-card">
      <div className="pf-card-title"><h3>Photos</h3></div>
      <div className="pr-subtabs"><button type="button" className="on">{isMe ? 'Your photos' : 'Photos'}</button></div>
      {data.photos.length === 0
        ? <p className="pf-muted center pr-pad">No photos to show.</p>
        : (
          <div className="pf-photo-grid">
            {data.photos.map((ph) => (
              <a key={ph.id} href={ph.url} target="_blank" rel="noreferrer"><img src={ph.url} alt="" /></a>
            ))}
          </div>
        )}
    </div>
  );

  const moreTitle = (MORE.find(([k]) => k === tab) || [])[1];

  return (
    <div className="pf-page">
      {topBar}

      {/* ---------------- header ---------------- */}
      <div className="pr-head">
        <div className="pr-wrap">
          <div className="pr-cover">
            {p.cover && <img src={p.cover} alt="Cover" />}
            {isMe && (
              <button type="button" className="pr-cover-btn" onClick={() => coverInput.current && coverInput.current.click()}>
                <Ic n="cam" s={18} /> {p.cover ? 'Edit cover photo' : 'Add cover photo'}
              </button>
            )}
          </div>

          <div className="pr-info">
            <div className="pr-avatar-wrap">
              <img className="pr-avatar" src={avatarOf({ ...p, name: p.name }, 400)} alt={p.name} />
              {isMe && (
                <button type="button" className="pr-avatar-btn" title="Update profile picture" onClick={() => avatarInput.current && avatarInput.current.click()}>
                  <Ic n="cam" s={18} />
                </button>
              )}
            </div>
            <div className="pr-id">
              <h1>{p.name}</h1>
              <button type="button" className="pr-friend-count" onClick={() => go('friends')}>
                {data.friends_count} friend{data.friends_count === 1 ? '' : 's'}
              </button>
            </div>
            <div className="pr-btns">{friendButtons()}</div>
          </div>

          <div className="pr-tabs">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => go(k)}>{label}</button>
            ))}
            <div className="pr-pop-wrap" ref={moreRef}>
              <button type="button" className={moreActive ? 'on' : ''} onClick={() => setMoreOpen((o) => !o)}>
                More <Ic n="down" s={16} />
              </button>
              {moreOpen && (
                <div className="pr-pop">
                  {visibleMore.map(([k, label]) => (
                    <button key={k} type="button" className="pr-pop-row" onClick={() => { setMoreOpen(false); go(k); }}>{label}</button>
                  ))}
                  {isMe && (
                    <button type="button" className="pr-pop-row" onClick={() => { setMoreOpen(false); setManageOpen(true); }}>Manage sections</button>
                  )}
                </div>
              )}
            </div>

            {isMe && (
              <div className="pr-pop-wrap pr-tabs-right" ref={menuRef}>
                <button type="button" className="pr-dots" aria-label="Profile settings" onClick={() => setMenuOpen((o) => !o)}><Ic n="dots" s={20} /></button>
                {menuOpen && (
                  <div className="pr-pop right wide">
                    {MENU.map((g) => (
                      <div key={g.title} className="pr-pop-group">
                        <h5>{g.title}</h5>
                        {g.items.map(([ic, label]) => (
                          <button key={label} type="button" className="pr-pop-row" onClick={() => { setMenuOpen(false); soon(); }}>
                            <Ic n={ic} s={20} /> {label}
                          </button>
                        ))}
                      </div>
                    ))}
                    <div className="pr-pop-group">
                      <h5>More options</h5>
                      <button type="button" className="pr-pop-row" onClick={() => { setMenuOpen(false); soon(); }}><Ic n="person" s={20} /> Profile status</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={choose('avatar')} />
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={choose('cover')} />

      {/* ---------------- body ---------------- */}
      <div className="pr-wrap pr-body">
        {tab === 'all' && allTab}
        {tab === 'about' && aboutTab}
        {tab === 'friends' && FriendsListCard()}
        {tab === 'photos' && photosTab}
        {tab === 'reels' && reelsTab}
        {moreTitle && emptyCard(moreTitle, `No ${moreTitle.toLowerCase()} to show.`)}
      </div>

      {toast && <div className="pr-toast">{toast}</div>}

      {pending && (
        <PhotoModal
          file={pending.file} kind={pending.kind} busy={saving} error={saveErr}
          onCancel={() => setPending(null)} onSave={savePhoto}
        />
      )}

      {editOpen && (
        <div className="confirm-overlay" onClick={() => setEditOpen(false)}>
          <div className="pf-modal pr-edit" onClick={(e) => e.stopPropagation()}>
            <h3>Edit profile</h3>
            <div className="pr-edit-sec">
              <div className="pr-edit-row"><b>Profile picture</b>
                <button type="button" className="pr-link" onClick={() => avatarInput.current && avatarInput.current.click()}>Edit</button></div>
              <img className="pr-edit-avatar" src={avatarOf({ ...p, name: p.name }, 200)} alt="" />
            </div>
            <div className="pr-edit-sec">
              <div className="pr-edit-row"><b>Cover photo</b>
                <button type="button" className="pr-link" onClick={() => coverInput.current && coverInput.current.click()}>{p.cover ? 'Edit' : 'Add'}</button></div>
              <div className="pr-edit-cover">{p.cover && <img src={p.cover} alt="" />}</div>
            </div>
            <div className="pr-edit-sec">
              <div className="pr-edit-row"><b>Bio</b></div>
              <div className="pf-bio-edit" style={{ padding: 0 }}>
                <textarea maxLength={255} placeholder="Describe yourself…" value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} />
                <small>{bioDraft.length}/255</small>
              </div>
            </div>
            <div className="pf-actions">
              <button type="button" className="fb-btn secondary" onClick={() => setEditOpen(false)}>Cancel</button>
              <button type="button" className="fb-btn primary" onClick={saveBio}>Save</button>
            </div>
          </div>
        </div>
      )}

      {manageOpen && (
        <div className="confirm-overlay" onClick={() => setManageOpen(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Manage sections</h3>
            <div className="pr-manage">
              {MORE.map(([k, label]) => (
                <label key={k}>
                  <span>{label}</span>
                  <input type="checkbox" checked={!hidden.includes(k)} onChange={() => toggleSection(k)} />
                </label>
              ))}
            </div>
            <div className="pf-actions">
              <button type="button" className="fb-btn primary" onClick={() => setManageOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {unfriendAsk && (
        <div className="confirm-overlay" onClick={() => setUnfriendAsk(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>Remove {p.name}?</h3>
            <p>You will no longer be friends. You can send a new request later.</p>
            <div className="confirm-actions">
              <button type="button" className="ghost" onClick={() => setUnfriendAsk(false)}>Cancel</button>
              <button type="button" className="danger" onClick={() => { setUnfriendAsk(false); act(() => api.delete(`/friends/${rel.id}`)); }}>Unfriend</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}