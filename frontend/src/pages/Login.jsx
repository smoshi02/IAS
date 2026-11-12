import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IconLogoMark, IconEye, IconEyeOff } from '../components/Icons';
import '../styles/login.css';

const LANGUAGES = ['English (US)', 'Filipino', 'Bisaya', 'Español', '日本語', '한국어', '中文(简体)'];

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
            <div className="lg-tile a">
              <img src="https://picsum.photos/seed/phishbook-a/400/400" alt="" />
            </div>
            <div className="lg-tile b">
              <img src="https://picsum.photos/seed/phishbook-b/260/340" alt="" />
            </div>
            <div className="lg-tile c">
              <img src="https://picsum.photos/seed/phishbook-c/220/220" alt="" />
            </div>
            <span className="lg-badge">Academic demo</span>
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