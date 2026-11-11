import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IconLogoMark, IconMail, IconLock, IconEye, IconEyeOff } from '../components/Icons';
import '../styles/auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
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
    <div className="auth-page">
      <div className="auth-body">
        <div className="auth-left">
          <div className="collage">
            <div className="collage-tile t1">
              <img src="https://picsum.photos/seed/phishbook-a/400/400" alt="" />
            </div>
            <div className="collage-tile t2">
              <img src="https://picsum.photos/seed/phishbook-b/260/260" alt="" />
            </div>
            <div className="collage-tile t3">
              <img src="https://picsum.photos/seed/phishbook-c/220/220" alt="" />
            </div>
            <div className="collage-caption">
              <div className="brand-row"><IconLogoMark /> PHISHBOOK</div>
              <p>A space for classmates to connect and share — built for this academic demo environment.</p>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="auth-card-header">
              <h2>Welcome back</h2>
              <p>Log in to continue to your account</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="input-group">
              <IconMail />
              <input
                type="text"
                placeholder="Email or Phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="input-group password-field">
              <IconLock />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="toggle-visibility" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <Link to="#" className="forgot-link">Forgot Password?</Link>

            <hr />

            <Link to="/register" className="btn-secondary">Create New Account</Link>
          </form>
        </div>
      </div>

      <footer className="auth-footer">
        <span>PHISHBOOK Demo</span>
        <span className="sep">·</span>
        <a href="#">About</a>
        <a href="#">Help</a>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <span className="sep">·</span>
        <span>© 2026 Academic Project</span>
      </footer>
    </div>
  );
}