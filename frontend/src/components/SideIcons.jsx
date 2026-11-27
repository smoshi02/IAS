import React from 'react';

/* Full-color sidebar icons (36x36 art, colors baked in) */
const S = ({ children }) => (
  <svg viewBox="0 0 36 36" aria-hidden="true">{children}</svg>
);

export const MetaAIIcon = () => (
  <S>
    {[0, 60, 120, 180, 240, 300].map((a, i) => (
      <ellipse
        key={a}
        cx="18" cy="8.5" rx="3.6" ry="6.2"
        transform={`rotate(${a} 18 18)`}
        fill={['#b44cf0', '#7b5cf5', '#4a7cf7', '#b44cf0', '#7b5cf5', '#4a7cf7'][i]}
      />
    ))}
  </S>
);

export const FriendsIcon = () => (
  <S>
    <circle cx="24" cy="12" r="5.5" fill="#4fd1c5" />
    <path d="M14 29c0-5.5 4.5-9 10-9s10 3.5 10 9z" fill="#4fd1c5" />
    <circle cx="13" cy="13" r="6" fill="#1b74e4" />
    <path d="M1.5 31c0-6.5 5-10.5 11.5-10.5S24.5 24.5 24.5 31z" fill="#2d88ff" />
  </S>
);

export const MarketplaceIcon = () => (
  <S>
    <path d="M5 6h26l3 9H2z" fill="#1b74e4" />
    <path d="M2 15h32c0 2.6-2.2 4.2-4.3 4.2S25.4 17.6 23.4 17.6 20 19.2 18 19.2 14.6 17.6 12.6 17.6 8.3 19.2 6.3 19.2 2 17.6 2 15z" fill="#4aa3ff" />
    <rect x="5" y="19" width="26" height="13" rx="1.5" fill="#2d88ff" />
    <rect x="9" y="22" width="8" height="10" rx="1" fill="#0a4fb3" />
    <rect x="21" y="22" width="6" height="6" rx="1" fill="#bfe0ff" />
  </S>
);

export const MemoriesIcon = () => (
  <S>
    <path d="M6 18a12 12 0 1 0 3.6-8.6" fill="none" stroke="#1b74e4" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M3.5 4.5 9.8 4l-.9 6.8z" fill="#1b74e4" transform="rotate(8 8 8)" />
    <path d="M18 10.5V18l5 3" fill="none" stroke="#1b74e4" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
  </S>
);

export const SavedIcon = () => (
  <S>
    <path d="M9 4h18a1.5 1.5 0 0 1 1.5 1.5V32L18 25.5 7.5 32V5.5A1.5 1.5 0 0 1 9 4Z" fill="#c13ac9" />
    <path d="M7.5 20h21v12L18 25.5 7.5 32Z" fill="#e0457b" />
  </S>
);

export const GroupsIcon = () => (
  <S>
    <circle cx="18" cy="18" r="16" fill="#1b74e4" />
    <circle cx="18" cy="11.5" r="3.6" fill="#fff" />
    <path d="M11.5 22c0-3.6 2.9-5.6 6.5-5.6s6.5 2 6.5 5.6z" fill="#fff" />
    <circle cx="9.8" cy="15.2" r="2.8" fill="#bfe0ff" />
    <path d="M4.5 23.5c0-2.9 2.2-4.4 5.3-4.4 1 0 1.8.2 2.5.5-1.5 1-2.3 2.3-2.5 3.9z" fill="#bfe0ff" />
    <circle cx="26.2" cy="15.2" r="2.8" fill="#bfe0ff" />
    <path d="M31.5 23.5c0-2.9-2.2-4.4-5.3-4.4-1 0-1.8.2-2.5.5 1.5 1 2.3 2.3 2.5 3.9z" fill="#bfe0ff" />
  </S>
);

export const ReelsIcon = () => (
  <S>
    <rect x="3" y="3" width="30" height="30" rx="8" fill="#ff6a5a" />
    <path d="M3 20h30v5a8 8 0 0 1-8 8H11a8 8 0 0 1-8-8z" fill="#ff8a3d" />
    <path d="M9 10.5h18M15 10.5l-2.5-7M23 10.5l-2.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M14.5 16.5v9l7.5-4.5z" fill="#fff" />
  </S>
);

export const FeedsIcon = () => (
  <S>
    <rect x="3" y="4" width="30" height="22" rx="5" fill="#1b74e4" />
    <rect x="8" y="10" width="7" height="6" rx="1.5" fill="#fff" />
    <rect x="18" y="10" width="10" height="2.4" rx="1.2" fill="#fff" />
    <rect x="18" y="14.6" width="6" height="2.4" rx="1.2" fill="#bfe0ff" />
    <circle cx="24" cy="26" r="8.5" fill="#fff" />
    <circle cx="24" cy="26" r="6.6" fill="#2a3a55" />
    <path d="M24 22v4.4l3 1.8" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </S>
);

export const EventsIcon = () => (
  <S>
    <rect x="3.5" y="5" width="29" height="27" rx="5" fill="#fff" stroke="#d8dadf" strokeWidth="1.5" />
    <path d="M3.5 10a5 5 0 0 1 5-5h19a5 5 0 0 1 5 5v3h-29z" fill="#f0405c" />
    <rect x="9" y="2.5" width="3" height="6" rx="1.5" fill="#c92a45" />
    <rect x="24" y="2.5" width="3" height="6" rx="1.5" fill="#c92a45" />
    <path d="m18 17.5 2.1 4.3 4.7.6-3.4 3.3.8 4.6-4.2-2.2-4.2 2.2.8-4.6-3.4-3.3 4.7-.6z" fill="#3b3f46" />
  </S>
);

/* ---- shown after "See more" ---- */
export const AdsManagerIcon = () => (
  <S>
    <rect x="4" y="19" width="7" height="13" rx="2" fill="#2d88ff" />
    <rect x="14.5" y="11" width="7" height="21" rx="2" fill="#1b74e4" />
    <rect x="25" y="3" width="7" height="29" rx="2" fill="#4aa3ff" />
  </S>
);

export const BirthdaysIcon = () => (
  <S>
    <rect x="4" y="15" width="28" height="17" rx="2.5" fill="#2d88ff" />
    <rect x="2" y="10" width="32" height="8" rx="2.5" fill="#1b74e4" />
    <rect x="15.5" y="10" width="5" height="22" fill="#f0405c" />
    <path d="M18 10c-1-4-6-6-7-3.5S14 10 18 10zM18 10c1-4 6-6 7-3.5S22 10 18 10z" fill="#ff6b8a" />
  </S>
);

export const ChatAIsIcon = () => (
  <S>
    <circle cx="9" cy="9" r="5.5" fill="#2d88ff" />
    <path d="M27 2.5 33 9l-6 6.5L21 9z" fill="#1b4ccf" />
    <circle cx="9" cy="27" r="5.5" fill="#5b5bd6" />
    <circle cx="27" cy="27" r="5.5" fill="#3a6df0" />
  </S>
);

export const GamingVideoIcon = () => (
  <S>
    <rect x="3" y="3" width="30" height="30" rx="8" fill="#1b74e4" />
    <path d="M10 13a3 3 0 0 1 3-3h10v4.5H14.5v7h4V19H24v6.5a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" fill="#fff" />
  </S>
);

export const MessengerIcon = () => (
  <S>
    <circle cx="18" cy="18" r="16" fill="#1b74e4" />
    <path d="M7.5 22.5 13.2 13.4a1.6 1.6 0 0 1 2.3-.4l4.3 3.2a.7.7 0 0 0 .9 0l5.8-4.4c.8-.6 1.8.4 1.2 1.2L22.9 22.1a1.6 1.6 0 0 1-2.3.4l-4.3-3.2a.7.7 0 0 0-.9 0l-5.8 4.4c-.8.6-1.8-.4-1.1-1.2z" fill="#fff" />
  </S>
);

export const OrdersIcon = () => (
  <S>
    <g transform="rotate(-35 18 18)">
      <rect x="2" y="7" width="32" height="22" rx="4" fill="#0b2a6f" />
      <rect x="2" y="12" width="32" height="5" fill="#2d88ff" />
      <rect x="6" y="22" width="9" height="2.6" rx="1.3" fill="#7fb6ff" />
    </g>
  </S>
);

export const PagesIcon = () => (
  <S>
    <rect x="5" y="3" width="3" height="30" rx="1.5" fill="#1b74e4" />
    <rect x="10" y="5" width="12" height="12" rx="2" fill="#ff7a45" />
    <rect x="17" y="11" width="14" height="14" rx="2" fill="#e8431f" />
  </S>
);

export const PlayGamesIcon = () => (
  <S>
    <path d="M9 9h18a7 7 0 0 1 7 7v3a7 7 0 0 1-7 7c-2.2 0-3.4-1-4.6-2.4H13.600c-1.200 1.400-2.400 2.400-4.600 2.400a7 7 0 0 1-7-7v-3a7 7 0 0 1 7-7z" fill="#2d88ff" />
    <path d="M10.500 14.500v6M7.500 17.500h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="25" cy="15.800" r="1.900" fill="#ffc640" />
    <circle cx="28.600" cy="19.400" r="1.900" fill="#ff7a45" />
  </S>
);

export const SupportIcon = () => (
  <S>
    <rect x="3" y="3" width="30" height="30" rx="8" fill="#1b74e4" />
    <path d="M18 27c-6-4.200-8.500-7-8.500-10.200a4.500 4.500 0 0 1 8.500-2 4.500 4.500 0 0 1 8.500 2C26.500 20 24 22.800 18 27z" fill="#fff" />
  </S>
);

export const AdActivityIcon = () => (
  <S>
    <rect x="3" y="3" width="30" height="30" rx="7" fill="#1b74e4" />
    <rect x="7" y="8" width="22" height="14" rx="2" fill="#bfe0ff" />
    <path d="m7 22 6.500-7 4.500 4.500 3.500-3.500L29 22z" fill="#fff" />
    <circle cx="23" cy="12.500" r="2" fill="#fff" />
    <rect x="7" y="25.500" width="14" height="2.600" rx="1.300" fill="#fff" />
  </S>
);