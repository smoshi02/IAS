import React, { useEffect, useRef, useState } from 'react';

export default function PostMenu({ onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="post-menu" ref={ref}>
      <button
        type="button"
        className="post-menu-btn"
        aria-label="Post options"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        &#8226;&#8226;&#8226;
      </button>
      {open && (
        <div className="post-menu-list">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            🗑 Delete post
          </button>
        </div>
      )}
    </div>
  );
}