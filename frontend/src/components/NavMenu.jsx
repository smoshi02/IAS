import React, { useEffect, useRef, useState } from 'react';

/**
 * A round navbar button that opens a dropdown panel (closes on outside click).
 * `children` can be a function: (close) => <content/>
 */
export default function NavMenu({ title, className = 'nav-circle', trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="nav-notif" ref={ref}>
      <button type="button" title={title} className={`${className} ${open ? 'open' : ''}`} onClick={() => setOpen((v) => !v)}>
        {trigger}
      </button>
      {open && (
        <div className="notif-panel menu-panel">
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}