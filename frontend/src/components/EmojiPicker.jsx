import React, { useRef, useState } from 'react';
import { Emoji, EmojiStyle } from 'emoji-picker-react';
import emojiData from 'emoji-picker-react/data/emojis-en';
import { IconSearch } from './Icons';

/* Full emoji picker (search, Recently Used, every category, category tabs) -
   the same set and look as the one in chat. Styles: .ep* in home.css */

const EMOJI_CATS = [
  { id: 'smileys_people', label: 'Smileys & People', icon: 'smile' },
  { id: 'animals_nature', label: 'Animals & Nature', icon: 'paw' },
  { id: 'food_drink', label: 'Food & Drink', icon: 'apple' },
  { id: 'activities', label: 'Activities', icon: 'ball' },
  { id: 'travel_places', label: 'Travel & Places', icon: 'beach' },
  { id: 'objects', label: 'Objects', icon: 'bulb' },
  { id: 'symbols', label: 'Symbols', icon: 'at' },
  { id: 'flags', label: 'Flags', icon: 'flag' },
];
const RECENT_KEY = 'msgr-recent-emojis';
const RECENT_MAX = 8;
const RECENT_DEFAULT = ['1f62d', '1f614', '2705', '2714-fe0f', '274c', '1f612', '1f979', '1f618'];

const unifiedToChar = (u) => String.fromCodePoint(...u.split('-').map((h) => parseInt(h, 16)));

const catSvg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const CatIcon = ({ name }) => {
  switch (name) {
    case 'smile': return <svg {...catSvg}><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9.5h.01M15 9.5h.01" /></svg>;
    case 'paw': return <svg {...catSvg}><circle cx="6" cy="11" r="1.8" /><circle cx="10" cy="6.5" r="1.8" /><circle cx="14" cy="6.5" r="1.8" /><circle cx="18" cy="11" r="1.8" /><path d="M12 12c-3 0-5 3-5 5 0 1.8 1.6 2.5 3 2.2 1-.2 1.4-.5 2-.5s1 .3 2 .5c1.4.3 3-.4 3-2.2 0-2-2-5-5-5z" /></svg>;
    case 'apple': return <svg {...catSvg}><path d="M12 8c-1.5-1.2-5-1.5-6 1.5-1 3 .5 8 3 10 1.3 1 2.2.5 3 .5s1.7.5 3-.5c2.5-2 4-7 3-10-1-3-4.5-2.7-6-1.5z" /><path d="M12 8c0-2 1-3.5 3-4" /></svg>;
    case 'ball': return <svg {...catSvg}><circle cx="12" cy="12" r="9" /><path d="M12 8l3.5 2.5-1.3 4h-4.4l-1.3-4z" /><path d="M12 8V3M15.5 10.5l4.5-1.5M14.2 14.5l3 3.8M9.8 14.5l-3 3.8M8.5 10.5L4 9" /></svg>;
    case 'beach': return <svg {...catSvg}><path d="M3 12a9 8 0 0 1 18 0z" /><path d="M12 12v9" /><path d="M4 21h16" /></svg>;
    case 'bulb': return <svg {...catSvg}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>;
    case 'at': return <svg {...catSvg}><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></svg>;
    case 'flag': return <svg {...catSvg}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>;
    default: return null;
  }
};

function loadRecent() {
  try {
    const r = JSON.parse(localStorage.getItem(RECENT_KEY) || 'null');
    if (Array.isArray(r) && r.length) return r.slice(0, RECENT_MAX);
  } catch (e) { /* ignore */ }
  return RECENT_DEFAULT;
}

const EmojiCell = React.memo(function EmojiCell({ u, onPick }) {
  return (
    <button type="button" className="ep-emoji" onClick={() => onPick(u)}>
      <Emoji unified={u} size={32} emojiStyle={EmojiStyle.FACEBOOK} lazyLoad />
    </button>
  );
});

export default function EmojiPicker({ onPick }) {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState(loadRecent);
  const [active, setActive] = useState(EMOJI_CATS[0].id);
  const bodyRef = useRef(null);
  const secRefs = useRef({});

  const pick = (u) => {
    onPick(unifiedToChar(u), u);
    setRecent((r) => {
      const next = [u, ...r.filter((x) => x !== u)].slice(0, RECENT_MAX);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
      return next;
    });
  };

  const term = q.trim().toLowerCase();
  const results = term
    ? EMOJI_CATS.flatMap((c) => (emojiData.emojis[c.id] || [])
      .filter((e) => e.n.some((n) => n.toLowerCase().includes(term))))
      .slice(0, 160)
    : [];

  const goTo = (id) => {
    setActive(id);
    const el = secRefs.current[id];
    if (el && bodyRef.current) bodyRef.current.scrollTop = el.offsetTop - bodyRef.current.offsetTop;
  };

  // highlight the tab of the section that is currently in view
  const onScroll = () => {
    const b = bodyRef.current;
    if (!b || term) return;
    let cur = EMOJI_CATS[0].id;
    EMOJI_CATS.forEach((c) => {
      const el = secRefs.current[c.id];
      if (el && el.offsetTop - b.offsetTop <= b.scrollTop + 24) cur = c.id;
    });
    if (cur !== active) setActive(cur);
  };

  return (
    <div className="ep">
      <div className="ep-search">
        <IconSearch />
        <input placeholder="Search emoji" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="ep-body" ref={bodyRef} onScroll={onScroll}>
        {term ? (
          <>
            <div className="ep-label">Search results</div>
            {results.length === 0 && <div className="ep-none">No emoji found</div>}
            <div className="ep-grid">{results.map((e) => <EmojiCell key={e.u} u={e.u} onPick={pick} />)}</div>
          </>
        ) : (
          <>
            <div className="ep-label">Recently Used</div>
            <div className="ep-grid">{recent.map((u) => <EmojiCell key={`r${u}`} u={u} onPick={pick} />)}</div>
            {EMOJI_CATS.map((c) => (
              <div key={c.id} ref={(el) => { secRefs.current[c.id] = el; }}>
                <div className="ep-label">{c.label}</div>
                <div className="ep-grid">
                  {(emojiData.emojis[c.id] || []).map((e) => <EmojiCell key={e.u} u={e.u} onPick={pick} />)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="ep-tabs">
        {EMOJI_CATS.map((c) => (
          <button
            type="button"
            key={c.id}
            title={c.label}
            className={!term && active === c.id ? 'on' : ''}
            onClick={() => { setQ(''); setTimeout(() => goTo(c.id), 0); }}
          ><CatIcon name={c.icon} /></button>
        ))}
      </div>
    </div>
  );
}