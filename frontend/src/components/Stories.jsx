import React, { useEffect, useRef, useState } from 'react';
import { Emoji, EmojiStyle } from 'emoji-picker-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { avatarOf } from '../utils/people';
import { IconPlus, IconLogoMark } from './Icons';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

const FILTERS = {
  none:  { label: 'Normal', css: 'none' },
  mono:  { label: 'Mono',   css: 'grayscale(1)' },
  warm:  { label: 'Warm',   css: 'sepia(.5) saturate(1.4)' },
  cool:  { label: 'Cool',   css: 'saturate(1.2) hue-rotate(-20deg) brightness(1.05)' },
  vivid: { label: 'Vivid',  css: 'saturate(1.8) contrast(1.1)' },
  fade:  { label: 'Fade',   css: 'contrast(.85) brightness(1.1) saturate(.8)' },
};
const filterCss = (k) => (FILTERS[k] ? FILTERS[k].css : 'none');

const TEXT_COLORS = {
  white: '#ffffff', black: '#000000', yellow: '#ffe14d', pink: '#ff6fae', blue: '#4da3ff',
};
const POSITIONS = ['top', 'center', 'bottom'];

const REACTIONS = [
  { key: 'like',  emoji: '👍', label: 'Like' },
  { key: 'love',  emoji: '❤️', label: 'Love' },
  { key: 'care',  emoji: '🥰', label: 'Care' },
  { key: 'haha',  emoji: '😆', label: 'Haha' },
  { key: 'wow',   emoji: '😮', label: 'Wow' },
  { key: 'sad',   emoji: '😢', label: 'Sad' },
  { key: 'angry', emoji: '😡', label: 'Angry' },
];
const emojiOf = (k) => (REACTIONS.find((r) => r.key === k) || {}).emoji;

// Facebook-style emoji image for a plain emoji character
function FbEmoji({ char, size = 22 }) {
  if (!char) return null;
  return (
    <span className="fbe">
      <Emoji
        unified={Array.from(char).map((c) => c.codePointAt(0).toString(16)).join('-')}
        size={size}
        emojiStyle={EmojiStyle.FACEBOOK}
      />
    </span>
  );
}

// zoom + rotation + filter chosen in the creator, applied the same way in the viewer
const mediaStyle = (s) => ({
  filter: filterCss(s.filter),
  transform: `rotate(${s.rotation || 0}deg) scale(${s.zoom || 1})`,
});

function StoryText({ text, color, pos }) {
  if (!text) return null;
  return (
    <div className={`story-text pos-${pos || 'bottom'}`} style={{ color: TEXT_COLORS[color] || '#fff' }}>
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Story creator (Facebook-style: options on the left, preview right) */
/* ------------------------------------------------------------------ */
function OptionRow({ icon, label, open, onToggle, children }) {
  return (
    <div className={`sc-opt ${open ? 'open' : ''}`}>
      <button type="button" className="sc-opt-head" onClick={onToggle}>
        <span className="sc-ico">{icon}</span>
        <span>{label}</span>
      </button>
      {open && <div className="sc-opt-body">{children}</div>}
    </div>
  );
}

function Editor({ file, busy, error, userName, me, onCancel, onShare }) {
  const [url, setUrl] = useState(null);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('none');
  const [color, setColor] = useState('white');
  const [pos, setPos] = useState('bottom');
  const [alt, setAlt] = useState('');
  const [ai, setAi] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [openRow, setOpenRow] = useState(null);
  const isVideo = file.type.startsWith('video');

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const toggle = (k) => setOpenRow((cur) => (cur === k ? null : k));
  const bump = (d) => setZoom((z) => Math.min(3, Math.max(0.5, +(z + d).toFixed(2))));
  const style = { filter: filterCss(filter), transform: `rotate(${rot}deg) scale(${zoom})` };

  return (
    <div className="sc-page">
      <aside className="sc-side">
        <div className="sc-bar">
          <button type="button" className="sc-x" onClick={onCancel} disabled={busy} aria-label="Close">&times;</button>
          <span className="sc-logo"><IconLogoMark /></span>
        </div>

        <div className="sc-scroll">
          <div className="sc-title"><h2>Your story</h2></div>

          <div className="sc-user">
            <img src={avatarOf(me)} alt="" />
            <b>{userName}</b>
          </div>

          <OptionRow icon="Aa" label="Add text" open={openRow === 'text'} onToggle={() => toggle('text')}>
            <textarea
              maxLength={200}
              placeholder="Start typing"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="sc-label">Text color</div>
            <div className="sc-swatches">
              {Object.keys(TEXT_COLORS).map((k) => (
                <button
                  type="button"
                  key={k}
                  title={k}
                  className={color === k ? 'on' : ''}
                  style={{ background: TEXT_COLORS[k] }}
                  onClick={() => setColor(k)}
                />
              ))}
            </div>
            <div className="sc-label">Text position</div>
            <div className="sc-chips">
              {POSITIONS.map((p) => (
                <button type="button" key={p} className={pos === p ? 'on' : ''} onClick={() => setPos(p)}>
                  {p[0].toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </OptionRow>

          <OptionRow icon="✦" label="Filters" open={openRow === 'filter'} onToggle={() => toggle('filter')}>
            <div className="sc-chips">
              {Object.keys(FILTERS).map((k) => (
                <button type="button" key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
                  {FILTERS[k].label}
                </button>
              ))}
            </div>
          </OptionRow>

          <OptionRow icon="Alt" label="Alternative text" open={openRow === 'alt'} onToggle={() => toggle('alt')}>
            <textarea
              maxLength={200}
              placeholder="Describe this photo or video for people who can't see it"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </OptionRow>

          <div className="sc-ai">
            <div className="sc-ai-text">
              <b>Add AI label</b>
              <p>We require you to label certain realistic content that&apos;s made with AI.</p>
            </div>
            <label className="sc-switch">
              <input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} />
              <span />
            </label>
          </div>

          {error && <div className="post-error">{error}</div>}
        </div>

        <div className="sc-foot">
          <button type="button" className="sc-discard" onClick={onCancel} disabled={busy}>Discard</button>
          <button
            type="button"
            className="sc-share"
            disabled={busy}
            onClick={() => onShare({
              file, text: text.trim(), filter, color, pos, alt: alt.trim(), ai, zoom, rot,
            })}
          >
            {busy ? 'Sharing…' : 'Share to story'}
          </button>
        </div>
      </aside>

      <section className="sc-main">
        <div className="sc-previewbox">
          <h4>Preview</h4>
          <div className="sc-canvas">
            <div className="sc-card">
              {url && (isVideo
                ? <video className="sc-media" src={url} autoPlay loop muted playsInline style={style} />
                : <img className="sc-media" src={url} alt="Preview" style={style} />)}
              <StoryText text={text} color={color} pos={pos} />
              {ai && <div className="story-ai">AI info</div>}
            </div>

            <div className="sc-zoom">
              <button type="button" className="sc-zbtn" onClick={() => bump(-0.1)} aria-label="Zoom out">&minus;</button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                aria-label="Zoom"
              />
              <button type="button" className="sc-zbtn" onClick={() => bump(0.1)} aria-label="Zoom in">+</button>
              <button type="button" className="sc-rotate" onClick={() => setRot((r) => (r + 90) % 360)}>
                &#x21BB; Rotate
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Story viewer (Facebook-style: story list left, card in the middle) */
/* ------------------------------------------------------------------ */
const sv = { viewBox: '0 0 24 24', fill: 'currentColor' };
const svStroke = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
const SvIcon = {
  Pause: () => <svg {...sv}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>,
  Play: () => <svg {...sv}><path d="M7 4.5v15l12-7.5z" /></svg>,
  Vol: () => <svg {...sv}><path d="M3 9v6h4l5 4V5L7 9H3z" /><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  Mute: () => <svg {...sv}><path d="M3 9v6h4l5 4V5L7 9H3z" /><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  Dots: () => <svg {...sv}><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>,
  Left: () => <svg {...svStroke}><path d="M15 5l-7 7 7 7" /></svg>,
  Right: () => <svg {...svStroke}><path d="M9 5l7 7-7 7" /></svg>,
  Trash: () => <svg {...svStroke} width="18" height="18"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>,
  Thumb: () => <svg {...sv}><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" /></svg>,
  Heart: () => <svg {...sv}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>,
};

function ReactIcon({ k }) {
  if (k === 'like') return <span className="sv-r-circle like"><SvIcon.Thumb /></span>;
  if (k === 'love') return <span className="sv-r-circle love"><SvIcon.Heart /></span>;
  return <FbEmoji char={emojiOf(k)} size={40} />;
}

const STORY_MS = 5000;

function Viewer({ groups, start, meId, seen, onSeen, onClose, onDelete, onReact, onCreate }) {
  const [gi, setGi] = useState(start);
  const [si, setSi] = useState(0);
  const [confirmDel, setConfirmDel] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');

  const elapsed = useRef(0);
  const videoRef = useRef(null);
  const menuRef = useRef(null);
  const nextRef = useRef(() => {});
  const noteTimer = useRef(null);

  const group = groups[gi];
  const story = group && group.stories[si];
  const isMine = !!group && group.user.id === meId;
  const isVideo = !!story && story.media_type === 'video';
  const storyId = story ? story.id : null;
  const halted = paused || typing || confirmDel || menuOpen;

  const next = () => {
    if (!group) return;
    if (si < group.stories.length - 1) setSi(si + 1);
    else if (gi < groups.length - 1) { setGi(gi + 1); setSi(0); }
    else onClose();
  };
  const prev = () => {
    if (si > 0) setSi(si - 1);
    else if (gi > 0) { setGi(gi - 1); setSi(0); }
  };
  nextRef.current = next;
  const hasPrev = gi > 0 || si > 0;
  const hasNext = !!group && (si < group.stories.length - 1 || gi < groups.length - 1);

  // new story: restart the progress bar, mark it as seen
  useEffect(() => {
    elapsed.current = 0;
    setProgress(0);
    setMenuOpen(false);
    setConfirmDel(false);
    setPaused(false);
    if (story && !isMine) onSeen(story.id);
    // eslint-disable-next-line
  }, [gi, si]);

  // photo timer (videos drive the bar from their own playback)
  useEffect(() => {
    if (!story || isVideo) return undefined;
    const id = setInterval(() => {
      if (halted) return;
      elapsed.current += 50;
      setProgress(Math.min(1, elapsed.current / STORY_MS));
      if (elapsed.current >= STORY_MS) {
        elapsed.current = -1e9; // never fire twice
        nextRef.current();
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [gi, si, isVideo, halted]);

  // pause / resume the video
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (halted) v.pause();
    else {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    }
  }, [halted, storyId]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const down = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // the story disappeared (deleted / expired): leave the viewer
  useEffect(() => { if (!story) onClose(); });

  if (!story) return null;

  const flash = (t) => {
    setNote(t);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(''), 2500);
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    const text = msg.trim();
    if (!text) return;
    try {
      await api.post(`/chat/${group.user.id}`, { body: text });
      setMsg('');
      flash('Message sent');
    } catch (err) {
      flash(err.response?.status === 403 ? 'You can only message friends.' : 'Could not send message.');
    }
  };

  const summary = Object.keys(story.reactions || {});

  return (
    <div className="sv-page">
      <aside className="sv-side">
        <div className="sc-bar">
          <button type="button" className="sc-x" onClick={onClose} aria-label="Close">&times;</button>
          <span className="sc-logo"><IconLogoMark /></span>
        </div>

        <div className="sv-scroll">
          <h2 className="sv-h">Stories</h2>

          <div className="sv-sec">Your story</div>
          <button type="button" className="sv-row" onClick={onCreate}>
            <span className="sv-plus">+</span>
            <span className="sv-rt">
              <b>Create a story</b>
              <small>Share a photo or video</small>
            </span>
          </button>

          <div className="sv-sec">All stories</div>
          {groups.map((g, i) => {
            const mine = g.user.id === meId;
            const fresh = mine ? 0 : g.stories.filter((s) => !seen.has(s.id)).length;
            const latest = g.stories[g.stories.length - 1];
            return (
              <button
                type="button"
                key={g.user.id}
                className={`sv-row ${i === gi ? 'cur' : ''}`}
                onClick={() => { setGi(i); setSi(0); }}
              >
                <span className={`sv-ring ${fresh ? 'new' : ''}`}>
                  <img src={avatarOf(g.user)} alt="" />
                </span>
                <span className="sv-rt">
                  <b>{mine ? 'Your story' : g.user.name}</b>
                  <small>
                    {fresh > 0 && <><em className="sv-new">{fresh} new</em> · </>}
                    {timeAgo(latest.created_at)}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="sv-stage">
        <div className="sv-cardrow">
          <button
            type="button"
            className="sv-arrow"
            style={{ visibility: hasPrev ? 'visible' : 'hidden' }}
            onClick={prev}
            aria-label="Previous"
          ><SvIcon.Left /></button>

          <div className="sv-card">
            <div className="story-bars">
              {group.stories.map((s, i) => (
                <span key={s.id}>
                  <i style={{ width: i < si ? '100%' : i === si ? `${progress * 100}%` : '0%' }} />
                </span>
              ))}
            </div>

            {isVideo
              ? (
                <video
                  ref={videoRef}
                  key={story.id}
                  src={story.media_url}
                  autoPlay
                  playsInline
                  muted={muted}
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    if (v.duration) setProgress(v.currentTime / v.duration);
                  }}
                  onEnded={next}
                  style={mediaStyle(story)}
                />
              )
              : <img key={story.id} src={story.media_url} alt={story.alt_text || 'Story'} style={mediaStyle(story)} />}

            <StoryText text={story.caption} color={story.text_color} pos={story.text_pos} />

            <div className="story-top">
              <img src={avatarOf(group.user)} alt="" />
              <strong>{group.user.name}</strong>
              <span>{timeAgo(story.created_at)}</span>
              <span className="sp" />
              {isVideo && (
                <button type="button" className="sv-ib" title={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((m) => !m)}>
                  {muted ? <SvIcon.Mute /> : <SvIcon.Vol />}
                </button>
              )}
              <button type="button" className="sv-ib" title={paused ? 'Play' : 'Pause'} onClick={() => setPaused((p) => !p)}>
                {paused ? <SvIcon.Play /> : <SvIcon.Pause />}
              </button>
              {isMine && (
                <span className="sv-menuwrap" ref={menuRef}>
                  <button type="button" className="sv-ib" title="More" onClick={() => setMenuOpen((v) => !v)}>
                    <SvIcon.Dots />
                  </button>
                  {menuOpen && (
                    <div className="sv-menu">
                      <button type="button" onClick={() => { setMenuOpen(false); setConfirmDel(true); }}>
                        <SvIcon.Trash /> Delete story
                      </button>
                    </div>
                  )}
                </span>
              )}
            </div>

            {story.ai_label && <div className="story-ai">AI info</div>}

            {summary.length > 0 && (
              <div className="story-summary">
                {summary.map((k) => <span key={k}><FbEmoji char={emojiOf(k)} size={18} /></span>)} {story.reactions_count}
              </div>
            )}

            {confirmDel && (
              <div className="story-confirm">
                <p>Delete this story?</p>
                <div>
                  <button type="button" className="ghost" onClick={() => setConfirmDel(false)}>Cancel</button>
                  <button type="button" className="danger" onClick={() => onDelete(story.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sv-arrow"
            style={{ visibility: hasNext ? 'visible' : 'hidden' }}
            onClick={next}
            aria-label="Next"
          ><SvIcon.Right /></button>
        </div>

        <form className="sv-bottom" onSubmit={sendMsg}>
          {!isMine && (
            <>
              <input
                className="sv-msg"
                placeholder="Send message…"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onFocus={() => setTyping(true)}
                onBlur={() => setTyping(false)}
              />
              <div className="sv-react">
                {REACTIONS.map((r) => (
                  <button
                    type="button"
                    key={r.key}
                    title={r.label}
                    className={story.my_reaction === r.key ? 'on' : ''}
                    onClick={() => onReact(story.id, r.key)}
                  >
                    <ReactIcon k={r.key} />
                  </button>
                ))}
              </div>
            </>
          )}
        </form>

        {note && <div className="sv-note">{note}</div>}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stories row                                                         */
/* ------------------------------------------------------------------ */
const seenKey = (id) => `story-seen-${id || 'me'}`;

export default function Stories() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [seen, setSeen] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(seenKey(user?.id)) || '[]')); } catch (e) { return new Set(); }
  });
  const fileRef = useRef(null);

  const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';

  const markSeen = (id) => setSeen((prev) => {
    if (prev.has(id)) return prev;
    const n = new Set(prev);
    n.add(id);
    try { localStorage.setItem(seenKey(user?.id), JSON.stringify([...n].slice(-500))); } catch (e) { /* ignore */ }
    return n;
  });

  const load = async () => {
    try {
      const { data } = await api.get('/stories');
      setGroups(data);
    } catch (e) { /* ignore */ }
  };

  // live: pick up new stories / reactions from other accounts every few seconds
  useEffect(() => {
    load();
    const wake = () => { if (document.visibilityState === 'visible') load(); };
    const id = setInterval(wake, 5000);
    return () => clearInterval(id);
  }, []);

  const pick = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) { setErr(''); setPending(file); }
  };

  const share = async ({ file, text, filter, color, pos, alt, ai, zoom, rot }) => {
    const fd = new FormData();
    fd.append('media', file);
    if (text) fd.append('caption', text);
    if (alt) fd.append('alt_text', alt);
    fd.append('filter', filter);
    fd.append('text_color', color);
    fd.append('text_pos', pos);
    fd.append('ai_label', ai ? '1' : '0');
    fd.append('zoom', String(zoom));
    fd.append('rotation', String(rot));
    setBusy(true);
    setErr('');
    try {
      await api.post('/stories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPending(null);
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not upload story.');
    } finally {
      setBusy(false);
    }
  };

  const react = async (id, type) => {
    try {
      const { data } = await api.post(`/stories/${id}/react`, { type });
      setGroups((gs) => gs.map((g) => ({
        ...g,
        stories: g.stories.map((s) => (s.id === id ? { ...s, ...data } : s)),
      })));
    } catch (e) { /* ignore */ }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/stories/${id}`);
      setOpen(null);
      await load();
    } catch (e) { /* ignore */ }
  };

  return (
    <>
      <div className="stories-wrap">
        <button type="button" className="story-tile add" onClick={() => fileRef.current && fileRef.current.click()}>
          <IconPlus />
          <span>Create story</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={pick} />

        {groups.map((g, i) => {
          const first = g.stories[0];
          return (
            <button type="button" className="story-tile" key={g.user.id} onClick={() => setOpen(i)}>
              {first.media_type === 'video'
                ? <video className="cover" src={first.media_url} muted preload="metadata" style={{ filter: filterCss(first.filter) }} />
                : <img className="cover" src={first.media_url} alt="" style={{ filter: filterCss(first.filter) }} />}
              <img className="ring" src={avatarOf(g.user)} alt="" />
              <span className="name">{g.user.id === user?.id ? 'Your story' : g.user.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {pending && (
        <Editor
          file={pending}
          busy={busy}
          error={err}
          userName={userName}
          me={user}
          onCancel={() => { setPending(null); setErr(''); }}
          onShare={share}
        />
      )}

      {open !== null && (
        <Viewer
          groups={groups}
          start={open}
          meId={user?.id}
          seen={seen}
          onSeen={markSeen}
          onClose={() => setOpen(null)}
          onDelete={remove}
          onReact={react}
          onCreate={() => { setOpen(null); if (fileRef.current) fileRef.current.click(); }}
        />
      )}
    </>
  );
}