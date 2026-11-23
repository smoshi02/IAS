import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IconLogoMark, IconEye, IconEyeOff, IconHeartFilled, IconStarFilled, IconStoreFilled, IconClock } from '../components/Icons';
import SimAd from '../components/SimAd';
import '../styles/login.css';

const LANGUAGES = ['English (US)', 'Filipino', 'Bisaya', 'Español', '日本語', '한국어', '中文(简体)'];

function CollageImg({ id }) {
  const files = {
    a: '/images/collage-a.jpg',      // guitarist  -> square card (behind)
    b: '/images/collage-b.jpg',      // camera     -> tall story card
    c: '/images/collage-c.jpg',      // coffee man -> post card
    avatar: '/images/collage-d.jpg', // woman      -> round avatar
  };
  return <img src={files[id]} alt="" className={`cimg-${id}`} />;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(() => {
    try { return localStorage.getItem('phishbook_remembered_identifier') || ''; } catch (e) { return ''; }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('phishbook_consent_ack') !== 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', { identifier, password });
      login(res.data.token, res.data.user);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-page">
      <div className="lg-main">
        <div className="lg-left">
          <div className="lg-logo"><IconLogoMark /> PHISHBOOK</div>

          <div className="lg-collage" aria-hidden="true">
            {/* Card 1 — square photo behind the story card */}
            <div className="lg-tile a">
              <span className="lg-tile-icon"><IconStoreFilled /></span>
              <CollageImg id="a" />
            </div>

            {/* Card 2 — tall story card */}
            <div className="lg-tile b">
              <div className="lg-story-progress"><span /></div>
              <span className="lg-chip"><IconClock />16:45</span>
              <CollageImg id="b" />
              <div className="lg-story-footer">
                <span className="lg-story-scrubber" />
                <span className="lg-story-dots"><i /><i /></span>
              </div>
            </div>

            {/* Card 3 — post card */}
            <div className="lg-tile c">
              <span className="lg-tile-icon"><IconStarFilled /></span>
              <div className="lg-tile-photo">
                <CollageImg id="c" />
              </div>
              <div className="lg-tile-lines"><span /><span /></div>
            </div>

            {/* Floating stickers */}
            <span className="lg-sticker lg-sticker-emoji" role="img" aria-label="">😄</span>
            <span className="lg-sticker lg-sticker-heart"><IconHeartFilled /></span>
            <span className="lg-sticker lg-sticker-avatar">
              <CollageImg id="avatar" />
            </span>
          </div>

          <h2 className="lg-tagline">
            Connect with <span className="accent">your classmates</span>.
          </h2>
        </div>

        <div className="lg-right">
          <form className="lg-card" onSubmit={handleSubmit}>
            <h1>Log into PHISHBOOK</h1>

            {error && <div className="lg-error" role="alert">{error}</div>}

            <input
              className="lg-field"
              type="text"
              placeholder="Email, mobile number or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />

            <div className="lg-password-wrap">
              <input
                className="lg-field"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="lg-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>

            <button type="submit" className="lg-btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            <Link to="#" className="lg-forgot">Forgot password?</Link>

            <hr className="lg-divider" />

            <Link to="/register" className="lg-btn-secondary">Create new account</Link>

            <div className="lg-brandmark"><IconLogoMark /> PHISHBOOK</div>

            <SimAd />
          </form>
        </div>
      </div>

      <footer className="lg-footer">
        {LANGUAGES.map((lang, i) => (
          <React.Fragment key={lang}>
            {i > 0 && <span className="sep">·</span>}
            <button type="button">{lang}</button>
          </React.Fragment>
        ))}
        <span className="sep">·</span>
        <button type="button">More languages…</button>
        <span className="lg-copyright">PHISHBOOK Academic Demo · © 2026</span>
      </footer>
    </div>
  );
}