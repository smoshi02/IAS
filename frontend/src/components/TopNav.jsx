import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IconLogoMark, IconSearch, IconUsers, IconUser, IconHome, IconBookmark, IconClock,
  IconLogout, IconGrid, IconMessenger, IconChevronDown,
} from './Icons';
import NavMenu from './NavMenu';
import NotificationBell from './NotificationBell';
import { ChatsPanel } from './Messenger';
import { avatarOf } from '../utils/people';

const SECTIONS = {
  feed: 'Home',
  friends: 'Friends',
  groups: 'Groups',
  saved: 'Saved',
  memories: 'Memories',
  photos: 'Photos',
};

const NAV_TABS = [
  { key: 'feed', label: 'Home', Icon: IconHome },
  { key: 'friends', label: 'Friends', Icon: IconUser },
  { key: 'groups', label: 'Groups', Icon: IconUsers },
  { key: 'saved', label: 'Saved', Icon: IconBookmark },
  { key: 'memories', label: 'Memories', Icon: IconClock },
];

/**
 * The top navbar shared by Home and Profile.
 *  section / onSection  - which tab is highlighted and what a tab/menu click does
 *  query / onQuery      - the search box (onSearch fires on Enter)
 *  notifs / chats       - results of useNotifications() / useChats()
 *  onOpenChat(peer)     - a conversation was picked in the Messenger menu
 *  onLogo / onLogout    - logo click and "Log out"
 */
export default function TopNav({
  section = '', onSection, query = '', onQuery, onSearch,
  notifs, chats, onOpenChat, onLogo, onLogout, navigate,
}) {
  const { user } = useAuth();
  const userFullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';

  return (
    <nav className="home-nav">
      <div className="nav-left">
        <div className="nav-logo" title="Phishbook" onClick={onLogo}>
          <IconLogoMark />
        </div>
        <div className="nav-search">
          <IconSearch />
          <input
            placeholder="Search Phishbook"
            value={query}
            onChange={(e) => onQuery && onQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && onSearch) onSearch(); }}
          />
        </div>
      </div>

      <div className="nav-tabs">
        {NAV_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            title={label}
            className={`nav-tab ${section === key ? 'active' : ''}`}
            onClick={() => onSection(key)}
          >
            <Icon />
            {key === 'friends' && notifs.pendingRequests > 0 && (
              <span className="nav-badge">{notifs.pendingRequests > 99 ? '99+' : notifs.pendingRequests}</span>
            )}
          </button>
        ))}
      </div>

      <div className="nav-actions">
        <NavMenu title="Menu" trigger={<IconGrid />}>
          {(close) => (
            <>
              <div className="notif-panel-head"><h3>Menu</h3></div>
              <div className="menu-list">
                {Object.keys(SECTIONS).map((key) => (
                  <div key={key} className="menu-row" onClick={() => { onSection(key); close(); }}>
                    <span className="menu-ico">{SECTIONS[key].charAt(0)}</span>
                    {SECTIONS[key]}
                  </div>
                ))}
              </div>
            </>
          )}
        </NavMenu>

        <NavMenu
          title="Messenger"
          trigger={(
            <>
              <IconMessenger />
              {chats.totalUnread > 0 && (
                <span className="nav-badge">{chats.totalUnread > 99 ? '99+' : chats.totalUnread}</span>
              )}
            </>
          )}
        >
          {(close) => (
            <ChatsPanel
              conversations={chats.conversations}
              onOpen={(peer) => { onOpenChat(peer); close(); }}
            />
          )}
        </NavMenu>

        <NotificationBell notifs={notifs} onOpenFriends={() => onSection('friends')} />

        <NavMenu
          title="Account"
          className="nav-avatar-btn"
          trigger={(
            <>
              <img src={avatarOf(user)} alt={userFullName} />
              <i className="nav-chev"><IconChevronDown /></i>
            </>
          )}
        >
          {(close) => (
            <div className="menu-list">
              <div className="menu-row profile" onClick={() => { close(); navigate('/profile'); }}>
                <img src={avatarOf(user)} alt="" />
                <div>
                  <b>{userFullName}</b>
                  <small>See your profile</small>
                </div>
              </div>
              <div className="menu-row" onClick={() => { close(); onLogout(); }}>
                <span className="menu-ico"><IconLogout /></span>
                Log out
              </div>
            </div>
          )}
        </NavMenu>
      </div>
    </nav>
  );
}