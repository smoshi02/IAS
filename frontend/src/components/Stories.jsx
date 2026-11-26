import React, { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IconPlus } from './Icons';

const COLORS = ['2C6BED', '42B72A', 'F0902F', '9b59b6', '16a085'];
const colorFor = (id) => COLORS[Math.abs(Number(id) || 0) % COLORS.length];
const avatarUrl = (name, bg) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=128`;

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
  { key: 'haha',  emoji: '😆', label: 'Haha' },
  { key: 'wow',   emoji: '😮', label: 'Wow' },
  { key: 'sad',   emoji: '😢', label: 'Sad' },
  { key: 'angry', emoji: '😡', label: 'Angry' },
];
const emojiOf = (k) => (REACTIONS.find((r) => r.key === k) || {}).emoji;

function StoryText({ text, color, pos }) {
  if (!text) return null;
  return (
    <div className={`story-text pos-${pos || 'bottom'}`} style={{ color: TEXT_COLORS[color] || '#fff' }}>
      {text}
    </div>
  );
}

function Editor({ file, busy, error, onCancel, onShare }) {
  const [url, setUrl] = useState(null);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('none');
  const [color, setColor] = useState('white');
  const [pos, setPos] = useState('bottom');
  const isVideo = file.type.startsWith('video');

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div className="story-viewer story-editor">
      <div className="editor-box">
        <div className="story-stage editor-stage">
          {url && (isVideo
            ? <video src={url} autoPlay loop muted playsInline style={{ filter: filterCss(filter) }} />
            : <img src={url} alt="Preview" style={{ filter: filterCss(filter) }} />)}
          <StoryText text={text} color={color} pos={pos} />
        </div>

        <div className="editor-panel">
          <h3>Create story</h3>

          <label>Text</label>
          <textarea
            maxLength={200}
            placeholder="Type something on your story…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <label>Filter</label>
          <div className="chips">
            {Object.keys(FILTERS).map((k) => (
              <button type="button" key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
                {FILTERS[k].label}
              </button>
            ))}
          </div>

          <label>Text color</label>
          <div className="swatches">
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

          <label>Text position</label>
          <div className="chips">
            {POSITIONS.map((p) => (
              <button type="button" key={p} className={pos === p ? 'on' : ''} onClick={() => setPos(p)}>
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {error && <div className="post-error">{error}</div>}

          <div className="editor-actions">
            <button type="button" className="ghost" onClick={onCancel} disabled={busy}>Cancel</button>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => onShare({ file, text: text.trim(), filter, color, pos })}
            >
              {busy ? 'Sharing…' : 'Share to story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Viewer({ groups, start, meId, onClose, onDelete, onReact }) {
  const [gi, setGi] = useState(start);
  const [si, setSi] = useState(0);
  const [confirmDel, setConfirmDel] = useState(false);
  const group = groups[gi];
  const story = group && group.stories[si];

  const next = () => {
    if (si < group.stories.length - 1) setSi(si + 1);
    else if (gi < groups.length - 1) { setGi(gi + 1); setSi(0); }
    else onClose();
  };
  const prev = () => {
    if (si > 0) setSi(si - 1);
    else if (gi > 0) { setGi(gi - 1); setSi(0); }
  };

  useEffect(() => { setConfirmDel(false); }, [gi, si]);

  useEffect(() => {
    if (!story || story.media_type === 'video' || confirmDel) return undefined;
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [gi, si, confirmDel]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!story) return null;

  const summary = Object.keys(story.reactions || {});

  return (
    <div className="story-viewer" onClick={onClose}>
      <div className={`story-stage ${confirmDel ? 'paused' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="story-bars">
          {group.stories.map((s, i) => (
            <span key={s.id}>
              <i className={i < si ? 'done' : i === si ? (story.media_type === 'video' ? 'done' : 'active') : ''} />
            </span>
          ))}
        </div>

        {story.media_type === 'video'
          ? <video key={story.id} src={story.media_url} autoPlay controls playsInline onEnded={next} style={{ filter: filterCss(story.filter) }} />
          : <img key={story.id} src={story.media_url} alt="Story" style={{ filter: filterCss(story.filter) }} />}

        <StoryText text={story.caption} color={story.text_color} pos={story.text_pos} />

        <div className="story-top">
          <img src={avatarUrl(group.user.name, colorFor(group.user.id))} alt="" />
          <strong>{group.user.name}</strong>
          <span>{timeAgo(story.created_at)}</span>
          <span className="sp" />
          {group.user.id === meId && (
            <button type="button" title="Delete story" onClick={() => setConfirmDel(true)}>🗑</button>
          )}
          <button type="button" title="Close" onClick={onClose}>&times;</button>
        </div>

        <button type="button" className="story-nav left" aria-label="Previous" onClick={prev} />
        <button type="button" className="story-nav right" aria-label="Next" onClick={next} />

        {summary.length > 0 && (
          <div className="story-summary">
            {summary.map((k) => <span key={k}>{emojiOf(k)}</span>)} {story.reactions_count}
          </div>
        )}

        <div className="story-react">
          {REACTIONS.map((r) => (
            <button
              type="button"
              key={r.key}
              title={r.label}
              className={story.my_reaction === r.key ? 'on' : ''}
              onClick={() => onReact(story.id, r.key)}
            >
              {r.emoji}
            </button>
          ))}
        </div>

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
    </div>
  );
}

export default function Stories() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get('/stories');
      setGroups(data);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const pick = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) { setErr(''); setPending(file); }
  };

  const share = async ({ file, text, filter, color, pos }) => {
    const fd = new FormData();
    fd.append('media', file);
    if (text) fd.append('caption', text);
    fd.append('filter', filter);
    fd.append('text_color', color);
    fd.append('text_pos', pos);
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
          <span>Add story</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={pick} />

        {groups.map((g, i) => {
          const first = g.stories[0];
          return (
            <button type="button" className="story-tile" key={g.user.id} onClick={() => setOpen(i)}>
              {first.media_type === 'video'
                ? <video className="cover" src={first.media_url} muted preload="metadata" style={{ filter: filterCss(first.filter) }} />
                : <img className="cover" src={first.media_url} alt="" style={{ filter: filterCss(first.filter) }} />}
              <img className="ring" src={avatarUrl(g.user.name, colorFor(g.user.id))} alt="" />
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
          onCancel={() => { setPending(null); setErr(''); }}
          onShare={share}
        />
      )}

      {open !== null && (
        <Viewer
          groups={groups}
          start={open}
          meId={user?.id}
          onClose={() => setOpen(null)}
          onDelete={remove}
          onReact={react}
        />
      )}
    </>
  );
}