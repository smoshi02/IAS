import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';

function avatarUrl(name, bg) {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=fff&bold=true&size=256`;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'You';

  return (
    <div className="home-page">
      <nav className="home-nav">
        <div className="nav-logo" onClick={() => navigate('/home')}>PHISHBOOK</div>
      </nav>
      <div className="profile-page">
        <img className="avatar big" src={avatarUrl(fullName, '3B5BDB')} alt={fullName} />
        <h2>{fullName}</h2>
        <p className="muted">@{user?.username}</p>
        <div className="profile-info">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Mobile:</strong> {user?.mobile_number || '—'}</p>
          <p><strong>Account status:</strong> {user?.status}</p>
        </div>
      </div>
    </div>
  );
}