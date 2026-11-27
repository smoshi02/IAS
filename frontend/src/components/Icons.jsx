import React from 'react';

const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconMail = (p) => (
  <svg {...base} {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 6 10-6" /></svg>
);
export const IconLock = (p) => (
  <svg {...base} {...p}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
);
export const IconEye = (p) => (
  <svg {...base} {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconEyeOff = (p) => (
  <svg {...base} {...p}><path d="M3 3l18 18" /><path d="M10.6 5.1A10.9 10.9 0 0112 5c7 0 11 7 11 7a17.7 17.7 0 01-3.1 3.9M6.6 6.6A17.6 17.6 0 001 12s4 7 11 7a10.6 10.6 0 005.4-1.5" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></svg>
);
export const IconHome = (p) => (
  <svg {...base} {...p}><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1v-9" /></svg>
);
export const IconSearch = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
);
export const IconBell = (p) => (
  <svg {...base} {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 004 0" /></svg>
);
export const IconUser = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
);
export const IconUsers = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 3-5.8 6.5-5.8s6.5 2.2 6.5 5.8" /><circle cx="18" cy="9" r="2.8" /><path d="M15.7 14.4c2.6.3 5.3 2 5.3 5.6" /></svg>
);
export const IconBookmark = (p) => (
  <svg {...base} {...p}><path d="M6 3h12v18l-6-4.5L6 21V3z" /></svg>
);
export const IconClock = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
);
export const IconThumbsUp = (p) => (
  <svg {...base} {...p}><path d="M7 11v9H4a1 1 0 01-1-1v-7a1 1 0 011-1h3zm0 0l4.5-8a2 2 0 013.6 1.4L14 9h5a2 2 0 012 2.3l-1.4 7A2 2 0 0117.6 20H7" /></svg>
);
export const IconComment = (p) => (
  <svg {...base} {...p}><path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z" /></svg>
);
export const IconShare = (p) => (
  <svg {...base} {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" /></svg>
);
export const IconLogout = (p) => (
  <svg {...base} {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const IconDashboard = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></svg>
);
export const IconActivity = (p) => (
  <svg {...base} {...p}><path d="M22 12h-4l-3 9-6-18-3 9H2" /></svg>
);
export const IconBeaker = (p) => (
  <svg {...base} {...p}><path d="M9 2v6.5L4 18a2 2 0 001.8 3h12.4A2 2 0 0020 18l-5-9.5V2" /><path d="M8.5 2h7" /><path d="M7 15h10" /></svg>
);
export const IconShield = (p) => (
  <svg {...base} {...p}><path d="M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-4z" /></svg>
);
export const IconImage = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
);
export const IconPlus = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconLogoMark = (p) => (
  <svg viewBox="0 0 32 32" width={28} height={28} {...p}>
    <rect width="32" height="32" rx="9" fill="url(#g)" />
    <path d="M11 22V13.5a5 5 0 015-5h2" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <circle cx="20" cy="9.5" r="2.1" fill="#fff" />
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="32" y2="32">
        <stop offset="0" stopColor="#2C6BED" />
        <stop offset="1" stopColor="#1C3FAE" />
      </linearGradient>
    </defs>
  </svg>
);
export const IconArrowLeft = (p) => (
  <svg {...base} {...p}><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
);
export const IconCheck = (p) => (
  <svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);export const IconHeartFilled = (p) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...p}>
    <path d="M12 21s-7.5-4.6-10-9.1C.4 8.6 2 5 5.6 5 8 5 9.8 6.3 12 9c2.2-2.7 4-4 6.4-4 3.6 0 5.2 3.6 3.6 6.9C19.5 16.4 12 21 12 21z" />
  </svg>
);
export const IconStarFilled = (p) => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" {...p}>
    <path d="M12 2.5l2.9 6 6.6.8-4.8 4.6 1.2 6.6L12 17.3 6.1 20.5l1.2-6.6-4.8-4.6 6.6-.8z" />
  </svg>
);
export const IconStoreFilled = (p) => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" {...p}>
    <path d="M4 10v9a1 1 0 001 1h5v-6h4v6h5a1 1 0 001-1v-9" />
    <path d="M2.5 10l1.6-5h15.8l1.6 5a2.5 2.5 0 01-5 .5 2.5 2.5 0 01-5 0 2.5 2.5 0 01-5 0 2.5 2.5 0 01-5-.5z" />
  </svg>
);
export const IconUserPlus = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5" /><path d="M19 8v6M16 11h6" /></svg>
);
export const IconUserCheck = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5" /><path d="M16 11.5l2 2 4-4" /></svg>
);

export const IconGrid = (p) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...p}>
    {[5, 12, 19].flatMap((cx) => [5, 12, 19].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.9" />))}
  </svg>
);
export const IconMessenger = (p) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...p}>
    <path d="M12 2C6.5 2 2 6.2 2 11.4c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.2 10-9.5S17.5 2 12 2z" fill="currentColor" />
    <path d="M6.3 14l4-4.2 2.5 2.4 4.9-2.8" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
export const IconChevronDown = (p) => (
  <svg {...base} {...p}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconSend = (p) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...p}><path d="M2.5 20.5l19-8.5-19-8.5v6.6l13 1.9-13 1.9z" /></svg>
);