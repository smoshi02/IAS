import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IconLogoMark, IconHome } from '../components/Icons';
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

  const pagesRef = useRef(1);
  const avatarInput = useRef(null);
  const coverInput = useRef(null);
  const postInput = useRef(null);

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

  const topBar = (
    <nav className="pf-nav">
      <div className="pf-nav-left">
        <span className="pf-logo" onClick={() => navigate('/home')} title="Phishbook"><IconLogoMark /></span>
        <button type="button" className="pf-home" onClick={() => navigate('/home')}><IconHome /> Home</button>
      </div>
      <div className="pf-nav-right">
        <img className="pf-nav-avatar" src={avatarOf(user, 80)} alt="" onClick={() => navigate('/profile')} />
        <button type="button" className="fb-btn secondary" onClick={handleLogout}>Log out</button>
      </div>
    </nav>
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
                <h3>Intro</h3>
                {p.bio ? <p className="pf-intro-bio">{p.bio}</p> : <p className="pf-muted">{isMe ? 'Add a bio from Edit profile.' : 'No bio yet.'}</p>}
                <div className="pf-fact">Joined {new Date(p.joined_at).toLocaleDateString([], { month: 'long', year: 'numeric' })}</div>
                <div className="pf-fact">{data.friends_count} friend{data.friends_count === 1 ? '' : 's'}</div>
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
                    <button type="button" className="fb-btn secondary" onClick={() => postInput.current && postInput.current.click()}>Photo/video</button>
                    <input
                      ref={postInput}
                      type="file"
                      accept="image/*,video/*"
                      hidden
                      onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) setCFile(f); }}
                    />
                    <button type="submit" className="fb-btn primary" disabled={posting || (!composer.trim() && !cFile)}>
                      {posting ? 'Posting…' : 'Post'}
                    </button>
                  </div>
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