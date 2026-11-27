import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios';

// How often we ask the server "anything new?". 3-5s feels instant for a
// friend request and is cheap (one small query). Polling pauses while the
// browser tab is hidden and refreshes the moment the tab is focused again.
const POLL_MS = 4000;

export default function useNotifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null);

  const lastSignature = useRef(null);
  const highestId = useRef(null);
  const inFlight = useRef(false);

  const fetchNow = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const { data } = await api.get('/notifications');
      setItems(data.items);
      setUnread(data.unread_count);
      setPendingRequests(data.pending_requests);

      const maxId = data.items.reduce((m, n) => Math.max(m, n.id), 0);
      const signature = `${data.pending_requests}|${data.items
        .map((n) => `${n.id}:${n.friendship ? n.friendship.status : '-'}`)
        .join(',')}`;

      if (highestId.current === null) {
        // first load: don't pop a toast for old notifications
        highestId.current = maxId;
      } else if (maxId > highestId.current) {
        const fresh = data.items.filter((n) => n.id > highestId.current && !n.read);
        highestId.current = maxId;
        if (fresh.length) setToast(fresh[0]); // list is newest-first
      }

      if (lastSignature.current !== null && lastSignature.current !== signature) {
        setTick((t) => t + 1);
      }
      lastSignature.current = signature;
    } catch (e) {
      /* offline / server restarting: try again next tick */
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    fetchNow();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchNow();
    }, POLL_MS);
    const wake = () => { if (document.visibilityState === 'visible') fetchNow(); };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
    };
  }, [fetchNow]);

  const markRead = useCallback(async (id) => {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try { await api.post(`/notifications/${id}/read`); } catch (e) { /* next poll corrects it */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try { await api.post('/notifications/read-all'); } catch (e) { /* next poll corrects it */ }
  }, []);

  const accept = useCallback(async (friendshipId) => {
    try { await api.post(`/friends/${friendshipId}/accept`); } catch (e) { /* refreshed below */ }
    await fetchNow();
  }, [fetchNow]);

  const decline = useCallback(async (friendshipId) => {
    try { await api.delete(`/friends/${friendshipId}`); } catch (e) { /* refreshed below */ }
    await fetchNow();
  }, [fetchNow]);

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    items, unread, pendingRequests, tick, toast,
    refresh: fetchNow, markRead, markAllRead, accept, decline, dismissToast,
  };
}