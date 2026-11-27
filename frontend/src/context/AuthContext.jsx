import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('phishbook_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token, userData) => {
    localStorage.setItem('phishbook_token', token);
    localStorage.setItem('phishbook_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('phishbook_token');
    localStorage.removeItem('phishbook_user');
    setUser(null);
  };

  // merge new fields into the logged-in user (e.g. a new profile photo)
  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try { localStorage.setItem('phishbook_user', JSON.stringify(next)); } catch (e) { /* ignore */ }
      return next;
    });
  };

  // pick up changes made on another device / tab (profile photo, bio)
  useEffect(() => {
    if (!localStorage.getItem('phishbook_token')) return;
    api.get('/me')
      .then(({ data }) => {
        if (data && data.id) {
          updateUser({ avatar_url: data.avatar_url, cover_url: data.cover_url, bio: data.bio });
        }
      })
      .catch(() => { /* ignore */ });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}