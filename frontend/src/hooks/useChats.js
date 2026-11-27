import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios';

const POLL_MS = 4000;

/**
 * Friends + last message + unread count, refreshed every few seconds.
 * Powers the messenger bubble badge, the Chats panel and the Contacts list.
 */
export default function useChats() {
  const [conversations, setConversations] = useState([]);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations);
    } catch (e) {
      /* try again next tick */
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    const wake = () => { if (document.visibilityState === 'visible') refresh(); };
    const id = setInterval(wake, POLL_MS);
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
    };
  }, [refresh]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return { conversations, totalUnread, refresh };
}