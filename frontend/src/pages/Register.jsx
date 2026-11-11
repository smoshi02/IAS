import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { IconLogoMark, IconUser, IconMail, IconLock } from '../components/Icons';
import '../styles/auth.css';

const initialForm = {
  first_name: '', last_name: '', email: '', mobile_number: '',
  username: '', password: '', password_confirmation: '',
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('phishbook_consent_ack') !== 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');

    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ['Passwords do not match.'] });
      return;
    }

    setLoading(true);
    try {
      await api.post('/register', form);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({ general: ['Registration failed. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-right full">
        <form className="auth-card wide" onSubmit={handleSubmit}>
          <div className="auth-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <IconLogoMark /> <strong style={{ color: '#1C3FAE' }}>PHISHBOOK</strong>
            </div>
            <h2>Get started</h2>
            <p>Create your account &mdash; academic demo only.</p>
          </div>

          {success && <div className="auth-success">{success}</div>}
          {errors.general && <div className="auth-error">{errors.general[0]}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <div className="input-group">
                <IconUser />
                <input name="first_name" placeholder="First name" value={form.first_name} onChange={handleChange} required />
              </div>
              {errors.first_name && <small className="field-error">{errors.first_name[0]}</small>}
            </div>
            <div className="form-group">
              <label>Last name</label>
              <div className="input-group">
                <IconUser />
                <input name="last_name" placeholder="Last name" value={form.last_name} onChange={handleChange} required />
              </div>
              {errors.last_name && <small className="field-error">{errors.last_name[0]}</small>}
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-group">
              <IconMail />
              <input type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
            </div>
            {errors.email && <small className="field-error">{errors.email[0]}</small>}
          </div>

          <div className="form-group">
            <label>Mobile number</label>
            <div className="input-group">
              <IconMail />
              <input name="mobile_number" placeholder="Mobile number (optional)" value={form.mobile_number} onChange={handleChange} />
            </div>
            <span className="field-hint">You may receive notifications from us.</span>
          </div>

          <div className="form-group">
            <label>Username</label>
            <div className="input-group">
              <IconUser />
              <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
            </div>
            {errors.username && <small className="field-error">{errors.username[0]}</small>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <div className="input-group">
                <IconLock />
                <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
              </div>
              {errors.password && <small className="field-error">{errors.password[0]}</small>}
            </div>
            <div className="form-group">
              <label>Confirm password</label>
              <div className="input-group">
                <IconLock />
                <input type="password" name="password_confirmation" placeholder="Confirm password" value={form.password_confirmation} onChange={handleChange} required />
              </div>
              {errors.password_confirmation && <small className="field-error">{errors.password_confirmation[0]}</small>}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Submit'}
          </button>

          <p className="muted small" style={{ textAlign: 'center' }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}