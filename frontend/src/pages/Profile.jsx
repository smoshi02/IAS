import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';
import useNotifications from '../hooks/useNotifications';
import useChats from '../hooks/useChats';
import { avatarOf, timeAgo } from '../utils/people';
import '../styles/home.css';

const POLL_MS = 5000;

const CamIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M9 3L7.2 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.2L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
  </svg>
);
const PenIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

/* ---------- preview + save dialog for a new profile / cover photo ---------- */
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
        <div className={`pf-preview ${kind}`}>
          {url && <img src={url} alt="Preview" />}
        </div>
        {error && <div className="post-error" style={{ margin: '0 16px' }}>{error}</div>}
        <div className="pf-actions">
          <button type="button" className="fb-btn secondary" disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="button" className="fb-btn primary" disabled={busy} onClick={onSave}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- one post on the profile (read-only) ---------- */
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

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const targetId = id ? Number(id) : user.id;

  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [pending, setPending] = useState(null); // { file, kind }
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [editBio, setEditBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [unfriendAsk, setUnfriendAsk] = useState(false);
  const [composer, setComposer] = useState('');
  const [cFile, setCFile] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState('');
  const [navQuery, setNavQuery] = useState('');
  const notifs = useNotifications();
  const chats = useChats();

  const pagesRef = useRef(1);
  const avatarInput = useRef(null);
  const coverInput = useRef(null);
  const postInput = useRef(null);
  const composerInput = useRef(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get(`/users/${targetId}/profile`);
      setData(res.data);
      setNotFound(false);
    } catch (e) {
      if (e.response && e.response.status === 404) setNotFound(true);
    }
  }, [targetId]);

  const loadPosts = useCallback(async (p = 1) => {
    if (p === 1 && pagesRef.current > 1) return; // the person loaded more: don't reset their list
    try {
      const res = await api.get('/posts', { params: { page: p, user_id: targetId } });
      setPosts((prev) => (p === 1 ? res.data.data : [...prev, ...res.data.data]));
      setPage(res.data.current_page);
      setLastPage(res.data.last_page);
      pagesRef.current = res.data.current_page;
    } catch (e) { /* try again next tick */ }
  }, [targetId]);

  // switching to another person's profile: start clean
  useEffect(() => {
    setData(null);
    setNotFound(false);
    setPosts([]);
    setPage(1);
    setLastPage(1);
    pagesRef.current = 1;
    setTab('posts');
  }, [targetId]);

  // live: photos, friend status and posts refresh every few seconds
  useEffect(() => {
    loadProfile();
    loadPosts(1);
    const tick = () => {
      if (document.visibilityState === 'visible') { loadProfile(); loadPosts(1); }
    };
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
    if (file) { setSaveErr(''); setPending({ file, kind }); }
  };

  const savePhoto = async () => {
    setSaving(true);
    setSaveErr('');
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
    } finally {
      setSaving(false);
    }
  };

  const saveBio = async () => {
    try {
      await api.patch('/profile', { bio: bioDraft });
      setEditBio(false);
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
    setPosting(true);
    setPostErr('');
    const fd = new FormData();
    if (text) fd.append('body', text);
    if (cFile) fd.append('media', cFile);
    try {
      const res = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts((prev) => [res.data, ...prev]);
      setComposer('');
      setCFile(null);
      loadProfile();
    } catch (er) {
      setPostErr(er.response?.data?.message || 'Could not post. Check the file size/type.');
    } finally {
      setPosting(false);
    }
  };

  // composer shortcuts (Live video / Photo-video / Life update)
  const openPicker = (accept) => {
    if (!postInput.current) return;
    postInput.current.accept = accept;
    postInput.current.click();
  };
  const startLifeUpdate = () => {
    setComposer((t) => t || 'Life update: ');
    if (composerInput.current) composerInput.current.focus();
  };

  // the exact same navbar as the Home page; picking anything there goes back to Home
  const topBar = (
    <div className="home-page nav-only">
      <TopNav
        section=""
        onSection={(key) => navigate('/home', { state: { section: key } })}
        query={navQuery}
        onQuery={setNavQuery}
        onSearch={() => navigate('/home', { state: { query: navQuery } })}
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
    return (
      <div className="pf-page">
        {topBar}
        <div className="pf-missing">This profile isn&apos;t available.</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pf-page">
        {topBar}
        <div className="pf-missing">Loading…</div>
      </div>
    );
  }

  const p = data.user;
  const isMe = data.is_me;
  const rel = data.friendship;

  const friendButtons = () => {
    if (isMe) {
      return (
        <button type="button" className="fb-btn secondary" onClick={() => { setBioDraft(p.bio || ''); setEditBio(true); }}>
          <PenIcon /> Edit profile
        </button>
      );
    }
    if (rel.status === 'friends') {
      return <button type="button" className="fb-btn secondary" disabled={busy} onClick={() => setUnfriendAsk(true)}>&#10003; Friends</button>;
    }
    if (rel.status === 'sent') {
      return (
        <button type="button" className="fb-btn secondary" disabled={busy} onClick={() => act(() => api.delete(`/friends/${rel.id}`))}>
          Cancel request
        </button>
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
      <button type="button" className="fb-btn primary" disabled={busy} onClick={() => act(() => api.post(`/friends/request/${p.id}`))}>
        Add friend
      </button>
    );
  };

  return (
    <div className="pf-page">
      {topBar}

      <div className="pf-head">
        <div className="pf-wrap">
          <div className="pf-cover">
            {p.cover && <img src={p.cover} alt="Cover" />}
            {isMe && (
              <button type="button" className="pf-cover-btn" onClick={() => coverInput.current && coverInput.current.click()}>
                <CamIcon /> Edit cover photo
              </button>
            )}
          </div>

          <div className="pf-info">
            <div className="pf-avatar-wrap">
              <img className="pf-avatar" src={avatarOf({ ...p, name: p.name }, 400)} alt={p.name} />
              {isMe && (
                <button type="button" className="pf-avatar-btn" title="Update profile picture" onClick={() => avatarInput.current && avatarInput.current.click()}>
                  <CamIcon />
                </button>
              )}
            </div>

            <div className="pf-id">
              <h1>{p.name}</h1>
              <div className="pf-sub">{data.friends_count} friend{data.friends_count === 1 ? '' : 's'} &middot; {data.posts_count} post{data.posts_count === 1 ? '' : 's'}</div>
              {p.bio && <div className="pf-bio">{p.bio}</div>}
            </div>

            <div className="pf-btns">{friendButtons()}</div>
          </div>

          <div className="pf-tabs">
            {[['posts', 'Posts'], ['about', 'About'], ['photos', 'Photos'], ['friends', 'Friends']].map(([k, label]) => (
              <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={choose('avatar')} />
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={choose('cover')} />

      <div className="pf-wrap pf-body">
        {tab === 'posts' && (
          <div className="pf-cols">
            <aside className="pf-left">
              <div className="pf-card">
                <h3>Personal details</h3>
                {p.bio ? <p className="pf-intro-bio">{p.bio}</p> : <p className="pf-muted">{isMe ? 'Add a bio from Edit profile.' : 'No bio yet.'}</p>}
                <div className="pf-detail"><span>Name</span><b>{p.name}</b></div>
                {isMe && data.me_details && (
                  <>
                    <div className="pf-detail"><span>Username</span><b>@{data.me_details.username}</b></div>
                    <div className="pf-detail"><span>Email</span><b>{data.me_details.email || '—'}</b></div>
                    <div className="pf-detail"><span>Mobile</span><b>{data.me_details.mobile_number || '—'}</b></div>
                  </>
                )}
                <div className="pf-detail"><span>Joined</span><b>{new Date(p.joined_at).toLocaleDateString([], { month: 'long', year: 'numeric' })}</b></div>
                <div className="pf-detail"><span>Friends</span><b>{data.friends_count}</b></div>
              </div>

              <div className="pf-card">
                <div className="pf-card-title"><h3>Photos</h3><button type="button" onClick={() => setTab('photos')}>See all</button></div>
                {data.photos.length === 0
                  ? <p className="pf-muted">No photos yet.</p>
                  : (
                    <div className="pf-grid3">
                      {data.photos.slice(0, 9).map((ph) => <img key={ph.id} src={ph.url} alt="" />)}
                    </div>
                  )}
              </div>

              <div className="pf-card">
                <div className="pf-card-title"><h3>Friends</h3><button type="button" onClick={() => setTab('friends')}>See all</button></div>
                {data.friends.length === 0
                  ? <p className="pf-muted">No friends yet.</p>
                  : (
                    <div className="pf-grid3 people">
                      {data.friends.slice(0, 9).map((f) => (
                        <div key={f.id} className="pf-mini" onClick={() => navigate(`/profile/${f.id}`)}>
                          <img src={avatarOf(f, 160)} alt="" />
                          <span>{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </aside>

            <section className="pf-right">
              {isMe && (
                <form className="pf-card pf-composer" onSubmit={submitPost}>
                  <div className="pf-composer-row">
                    <img src={avatarOf(user, 80)} alt="" />
                    <input
                      ref={composerInput}
                      placeholder="What's on your mind?"
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                    />
                  </div>
                  {cFile && (
                    <div className="pf-attach">
                      {cFile.name}
                      <button type="button" onClick={() => setCFile(null)}>Remove</button>
                    </div>
                  )}
                  {postErr && <div className="post-error">{postErr}</div>}
                  <div className="pf-composer-foot">
                    <button type="button" className="pf-act" onClick={() => openPicker('video/*')}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#f3425f" d="M4.5 5.5h9A2.5 2.5 0 0 1 16 8v8a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 2 16V8a2.5 2.5 0 0 1 2.5-2.5Zm12.8 4.2 4-2.3a.6.6 0 0 1 .9.5v8.2a.6.6 0 0 1-.9.5l-4-2.3Z" />
                        <circle cx="9" cy="12" r="2.6" fill="#fff" />
                        <circle cx="9" cy="12" r="1.1" fill="#f3425f" />
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
                        <path fill="#6cc4f5" d="M7 4.500c1.800-1 3.200-.4 4.600.2L7 9.500z" />
                      </svg>
                      Life update
                    </button>
                    <input
                      ref={postInput}
                      type="file"
                      accept="image/*,video/*"
                      hidden
                      onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) setCFile(f); }}
                    />
                  </div>
                  {(composer.trim() || cFile) && (
                    <button type="submit" className="fb-btn primary pf-post-submit" disabled={posting}>
                      {posting ? 'Posting…' : 'Post'}
                    </button>
                  )}
                </form>
              )}

              <h3 className="pf-section">Posts</h3>
              {posts.length === 0 && <div className="pf-card pf-muted center">No posts to show.</div>}
              {posts.map((post) => <ProfilePost key={post.id} post={post} />)}
              {page < lastPage && (
                <button type="button" className="fb-btn secondary block" onClick={() => loadPosts(page + 1)}>Load more</button>
              )}
            </section>
          </div>
        )}

        {tab === 'about' && (
          <div className="pf-card pf-about">
            <h3>About</h3>
            <div className="pf-row"><span>Name</span><b>{p.name}</b></div>
            <div className="pf-row"><span>Bio</span><b>{p.bio || '—'}</b></div>
            <div className="pf-row"><span>Joined</span><b>{new Date(p.joined_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</b></div>
            {isMe && data.me_details && (
              <>
                <div className="pf-row"><span>Username</span><b>@{data.me_details.username}</b></div>
                <div className="pf-row"><span>Email</span><b>{data.me_details.email || '—'}</b></div>
                <div className="pf-row"><span>Mobile</span><b>{data.me_details.mobile_number || '—'}</b></div>
                <div className="pf-row"><span>Account status</span><b>{data.me_details.status}</b></div>
              </>
            )}
          </div>
        )}

        {tab === 'photos' && (
          <div className="pf-card">
            <h3>Photos</h3>
            {data.photos.length === 0
              ? <p className="pf-muted">No photos yet.</p>
              : (
                <div className="pf-photo-grid">
                  {data.photos.map((ph) => (
                    <a key={ph.id} href={ph.url} target="_blank" rel="noreferrer"><img src={ph.url} alt="" /></a>
                  ))}
                </div>
              )}
          </div>
        )}

        {tab === 'friends' && (
          <div className="pf-card">
            <h3>Friends</h3>
            {data.friends.length === 0
              ? <p className="pf-muted">No friends yet.</p>
              : (
                <div className="pf-friend-grid">
                  {data.friends.map((f) => (
                    <div key={f.id} className="pf-friend" onClick={() => navigate(`/profile/${f.id}`)}>
                      <img src={avatarOf(f, 160)} alt="" />
                      <b>{f.name}</b>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>

      {pending && (
        <PhotoModal
          file={pending.file}
          kind={pending.kind}
          busy={saving}
          error={saveErr}
          onCancel={() => setPending(null)}
          onSave={savePhoto}
        />
      )}

      {editBio && (
        <div className="confirm-overlay" onClick={() => setEditBio(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit profile</h3>
            <div className="pf-bio-edit">
              <label htmlFor="pf-bio">Bio</label>
              <textarea
                id="pf-bio"
                maxLength={255}
                placeholder="Describe yourself…"
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
              />
              <small>{bioDraft.length}/255</small>
            </div>
            <div className="pf-actions">
              <button type="button" className="fb-btn secondary" onClick={() => setEditBio(false)}>Cancel</button>
              <button type="button" className="fb-btn primary" onClick={saveBio}>Save</button>
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
              <button
                type="button"
                className="danger"
                onClick={() => { setUnfriendAsk(false); act(() => api.delete(`/friends/${rel.id}`)); }}
              >Unfriend</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}