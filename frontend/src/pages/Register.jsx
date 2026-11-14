import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { IconLogoMark, IconArrowLeft, IconCheck, IconEye, IconEyeOff } from '../components/Icons';
import '../styles/auth.css';
import '../styles/signup.css';

/**
 * Single-page sign-up form: name, birthday, gender, contact (mobile or
 * email), password and terms are all shown together and submitted at once.
 */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const GENDERS = [
  { value: 'FEMALE', label: 'Female' },
  { value: 'MALE', label: 'Male' },
  {
    value: 'OTHER',
    label: 'More options',
    hint: "Choose this if Female or Male doesn't describe you, or you'd rather not say.",
  },
];

const MIN_AGE = 13;

const initialForm = {
  first_name: '', last_name: '',
  month: '', day: '', year: '',
  gender: '',
  contact_type: 'mobile',
  mobile_number: '', email: '',
  password: '', remember: false,
  terms_accepted: false,
};

const daysInMonth = (month, year) => new Date(Number(year) || 2000, Number(month), 0).getDate();

function calcAge(year, month, day) {
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) age -= 1;
  return age;
}

const cleanMobile = (v) => v.replace(/[\s\-().]/g, '');

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '' };
  if (pw.length < 8) return { score: 0, label: 'Too short' };
  let score = 1;
  if ((/[a-z]/.test(pw) && /[A-Z]/.test(pw)) || (/[A-Za-z]/.test(pw) && /\d/.test(pw))) score += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score += 1;
  return { score, label: ['', 'Weak', 'Fair', 'Strong'][score] };
}

// Which section a field's error belongs to, so we can scroll to it.
const FIELD_SECTION = {
  first_name: 'su-sec-name', last_name: 'su-sec-name',
  birthday: 'su-sec-birthday',
  gender: 'su-sec-gender',
  mobile_number: 'su-sec-contact', email: 'su-sec-contact',
  password: 'su-sec-password',
  terms_accepted: 'su-sec-terms',
};

function validateAll(f) {
  const e = {};
  if (!f.first_name.trim()) e.first_name = ['Enter your first name.'];
  if (!f.last_name.trim()) e.last_name = ['Enter your last name.'];

  if (!f.month || !f.day || !f.year) {
    e.birthday = ['Select your month, day and year of birth.'];
  } else {
    const y = Number(f.year); const m = Number(f.month); const d = Number(f.day);
    const real = new Date(y, m - 1, d);
    const valid = real.getFullYear() === y && real.getMonth() === m - 1 && real.getDate() === d;
    const age = calcAge(y, m, d);
    if (!valid || age < 0) e.birthday = ['Enter a valid birthday.'];
    else if (age < MIN_AGE) e.birthday = [`You must be at least ${MIN_AGE} years old to sign up.`];
  }

  if (!f.gender) e.gender = ['Select an option to continue.'];

  if (f.contact_type === 'mobile') {
    if (!/^\+?[0-9]{7,15}$/.test(cleanMobile(f.mobile_number))) {
      e.mobile_number = ['Enter a valid mobile number.'];
    }
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    e.email = ['Enter a valid email address.'];
  }

  if (f.password.length < 8) e.password = ['Your password needs at least 8 characters.'];
  if (!f.terms_accepted) e.terms_accepted = ['You need to agree to the terms and policies to continue.'];

  return e;
}

function Field({ id, label, error, ...inputProps }) {
  return (
    <div className={`su-field${error ? ' has-error' : ''}`}>
      <input id={id} placeholder=" " aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...inputProps} />
      <label htmlFor={id}>{label}</label>
      {error && <small id={`${id}-err`} className="su-error" role="alert">{error}</small>}
    </div>
  );
}

function Terms() {
  return (
    <div className="su-terms" tabIndex={0} aria-label="Terms and policies">
      <h4>About this exercise</h4>
      <p>
        PHISHBOOK is a supervised academic exercise built for a cybersecurity and web development
        class. It is not a real social network, and it should only be used by authorized
        participants.
      </p>
      <h4>What we store</h4>
      <p>
        To create your account we store your name, birthday, gender, your mobile number or email,
        and the time you accepted these terms. Your password is stored only as a one-way hash, so
        nobody, including administrators, can read it back.
      </p>
      <h4>What is monitored</h4>
      <p>
        Sign-in attempts (the email, mobile number or username you submit, the date and time, and
        whether the password field was filled in) are recorded for the exercise. Your instructor can
        view this activity in aggregate.
      </p>
      <h4>Use test details only</h4>
      <p>
        Please use dummy information and a password you do not use anywhere else. Do not enter real
        third-party credentials or anyone else's personal details.
      </p>
      <h4>Your account</h4>
      <p>
        An administrator may deactivate or delete accounts at any time as part of running the
        exercise. By checking &ldquo;I agree&rdquo; you confirm you have read these terms and are
        joining as a participant in this activity.
      </p>
    </div>
  );
}

function Section({ id, title, sub, children }) {
  return (
    <section id={id} className="su-section">
      <div className="su-section-head">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </section>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [learn, setLearn] = useState({ contact: false, remember: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('phishbook_consent_ack') !== 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const set = (name, value) => {
    setForm((f) => {
      const next = { ...f, [name]: value };
      // Keep the chosen day valid when the month or year changes.
      if ((name === 'month' || name === 'year') && next.day) {
        next.day = String(Math.min(Number(next.day), daysInMonth(next.month || 1, next.year)));
      }
      return next;
    });
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      delete next[name];
      delete next.general;
      if (name === 'month' || name === 'day' || name === 'year') delete next.birthday;
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  };

  const scrollToFirstError = (errs) => {
    const firstKey = Object.keys(errs)[0];
    const sectionId = FIELD_SECTION[firstKey];
    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const submit = async () => {
    setLoading(true);
    setErrors({});
    const mm = String(form.month).padStart(2, '0');
    const dd = String(form.day).padStart(2, '0');
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      birthday: `${form.year}-${mm}-${dd}`,
      gender: form.gender,
      password: form.password,
      terms_accepted: true,
      ...(form.contact_type === 'mobile'
        ? { mobile_number: cleanMobile(form.mobile_number) }
        : { email: form.email.trim() }),
    };

    try {
      await api.post('/register', payload);
      try {
        if (form.remember) {
          localStorage.setItem(
            'phishbook_remembered_identifier',
            form.contact_type === 'mobile' ? payload.mobile_number : payload.email,
          );
        } else {
          localStorage.removeItem('phishbook_remembered_identifier');
        }
      } catch (_) { /* storage can be unavailable; the account is still created */ }
      setDone(true);
    } catch (err) {
      if (err.response?.status === 422) {
        const serverErrors = err.response.data.errors || {};
        setErrors(serverErrors);
        scrollToFirstError(serverErrors);
      } else if (err.response?.status === 429) {
        setErrors({ general: ['Too many attempts. Please wait a minute and try again.'] });
      } else {
        setErrors({ general: ['Something went wrong. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    const allErrors = validateAll(form);
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      if (allErrors.terms_accepted && Object.keys(allErrors).length === 1) setTermsOpen(true);
      scrollToFirstError(allErrors);
      return;
    }
    setErrors({});
    submit();
  };

  const switchContact = () => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.mobile_number;
      delete next.email;
      return next;
    });
    setForm((f) => ({ ...f, contact_type: f.contact_type === 'mobile' ? 'email' : 'mobile' }));
  };

  const years = [];
  for (let y = new Date().getFullYear(); y >= 1900; y -= 1) years.push(y);
  const dayCount = form.month ? daysInMonth(form.month, form.year) : 31;

  const age = form.month && form.day && form.year
    ? calcAge(Number(form.year), Number(form.month), Number(form.day))
    : null;
  const strength = passwordStrength(form.password);

  /* ----------------------------------------------------------- success */
  if (done) {
    return (
      <div className="su-page">
        <div className="su-shell su-shell-single">
          <div className="su-success">
            <div className="su-success-badge"><IconCheck width={34} height={34} /></div>
            <h1>You're all set, {form.first_name.trim()}!</h1>
            <p>
              Your account has been created. Log in with your{' '}
              {form.contact_type === 'mobile' ? 'mobile number' : 'email address'} and password to continue.
            </p>
            <button type="button" className="su-btn su-btn-primary" onClick={() => navigate('/login')}>
              Go to log in
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- form */
  return (
    <div className="su-page">
      <div className="su-shell su-shell-single">
        <header className="su-header">
          <Link to="/login" className="su-back" aria-label="Back to log in">
            <IconArrowLeft />
          </Link>
          <div className="su-brand"><IconLogoMark /><span>PHISHBOOK</span></div>
          <span aria-hidden="true" />
        </header>

        <form className="su-onepage" onSubmit={handleSubmit} noValidate>
          <div className="su-intro">
            <h1>Create your account</h1>
            <p>Fill in your details below — it only takes a minute.</p>
          </div>

          {errors.general && <div className="su-banner" role="alert">{errors.general[0]}</div>}
          <div className="su-note">Academic demo: please use test details, not your real personal information.</div>

          {/* name */}
          <Section id="su-sec-name" title="Name">
            <div className="su-row">
              <Field id="su-first" name="first_name" label="First name" autoComplete="given-name"
                value={form.first_name} onChange={handleChange} error={errors.first_name?.[0]} />
              <Field id="su-last" name="last_name" label="Last name" autoComplete="family-name"
                value={form.last_name} onChange={handleChange} error={errors.last_name?.[0]} />
            </div>
          </Section>

          {/* birthday */}
          <Section id="su-sec-birthday" title="Birthday" sub="This helps us confirm you're old enough to join.">
            {age !== null && age >= 0 && <div className="su-birthday-label"><span>{age} years old</span></div>}
            <div className="su-row su-row-3">
              <div className="su-select">
                <select name="month" aria-label="Month" value={form.month} onChange={handleChange}>
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="su-select">
                <select name="day" aria-label="Day" value={form.day} onChange={handleChange}>
                  <option value="">Day</option>
                  {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="su-select">
                <select name="year" aria-label="Year" value={form.year} onChange={handleChange}>
                  <option value="">Year</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            {errors.birthday && <small className="su-error" role="alert">{errors.birthday[0]}</small>}
          </Section>

          {/* gender */}
          <Section id="su-sec-gender" title="Gender">
            <div className="su-radio-group" role="radiogroup" aria-label="Gender">
              {GENDERS.map((g) => (
                <label key={g.value} className={`su-radio${form.gender === g.value ? ' selected' : ''}`}>
                  <span className="su-radio-text">
                    <span className="su-radio-label">{g.label}</span>
                    {g.hint && <span className="su-radio-hint">{g.hint}</span>}
                  </span>
                  <input type="radio" name="gender" value={g.value}
                    checked={form.gender === g.value} onChange={handleChange} />
                  <span className="su-radio-dot" aria-hidden="true" />
                </label>
              ))}
            </div>
            {errors.gender && <small className="su-error" role="alert">{errors.gender[0]}</small>}
          </Section>

          {/* contact */}
          <Section id="su-sec-contact" title="Mobile number or email">
            {form.contact_type === 'mobile' ? (
              <Field id="su-mobile" name="mobile_number" type="tel" inputMode="tel" label="Mobile number"
                autoComplete="tel" value={form.mobile_number} onChange={handleChange}
                error={errors.mobile_number?.[0]} />
            ) : (
              <Field id="su-email" name="email" type="email" label="Email address"
                autoComplete="email" value={form.email} onChange={handleChange}
                error={errors.email?.[0]} />
            )}
            <p className="su-help">
              {form.contact_type === 'mobile'
                ? 'You may receive text messages from us about your account. Message and data rates may apply.'
                : "We'll use this address to identify your account."}{' '}
              <button type="button" className="su-link" aria-expanded={learn.contact}
                onClick={() => setLearn((l) => ({ ...l, contact: !l.contact }))}>
                Learn more
              </button>
            </p>
            {learn.contact && (
              <p className="su-help su-help-more">
                You log in with this contact detail, so pick one you can access. It is stored only for
                this academic exercise and is visible to the administrator.
              </p>
            )}
            <button type="button" className="su-link su-contact-switch" onClick={switchContact}>
              {form.contact_type === 'mobile' ? 'Use an email address instead' : 'Use a mobile number instead'}
            </button>
          </Section>

          {/* password */}
          <Section id="su-sec-password" title="Password" sub="Use at least 8 characters. Mixing letters, numbers and symbols makes it stronger.">
            <div className="su-field su-password">
              <input id="su-password" name="password" placeholder=" " autoComplete="new-password"
                type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange}
                aria-invalid={!!errors.password} aria-describedby={errors.password ? 'su-password-err' : undefined} />
              <label htmlFor="su-password">Password</label>
              <button type="button" className="su-eye" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
              {errors.password && <small id="su-password-err" className="su-error" role="alert">{errors.password[0]}</small>}
            </div>

            {form.password && (
              <div className={`su-strength s${strength.score}`} aria-live="polite">
                <div className="bars"><span /><span /><span /></div>
                <em>{strength.label}</em>
              </div>
            )}

            <label className="su-check">
              <input type="checkbox" checked={form.remember}
                onChange={(e) => set('remember', e.target.checked)} />
              <span className="box" aria-hidden="true"><IconCheck width={14} height={14} strokeWidth={3} /></span>
              <span>
                Remember login info.{' '}
                <button type="button" className="su-link" aria-expanded={learn.remember}
                  onClick={(e) => { e.preventDefault(); setLearn((l) => ({ ...l, remember: !l.remember })); }}>
                  Learn more
                </button>
              </span>
            </label>
            {learn.remember && (
              <p className="su-help su-help-more">
                We'll keep your {form.contact_type === 'mobile' ? 'mobile number' : 'email address'} on
                this device so it's filled in on the log in page. Your password is never saved.
              </p>
            )}
          </Section>

          {/* terms */}
          <Section id="su-sec-terms" title="Terms and policies">
            <label className={`su-check su-terms-check${errors.terms_accepted ? ' has-error' : ''}`}>
              <input type="checkbox" name="terms_accepted" checked={form.terms_accepted}
                onChange={handleChange} />
              <span className="box" aria-hidden="true"><IconCheck width={14} height={14} strokeWidth={3} /></span>
              <span>
                I agree to the PHISHBOOK terms and policies for this exercise.{' '}
                <button type="button" className="su-link" aria-expanded={termsOpen}
                  onClick={(e) => { e.preventDefault(); setTermsOpen((v) => !v); }}>
                  {termsOpen ? 'Hide details' : 'Read details'}
                </button>
              </span>
            </label>
            {errors.terms_accepted && <small className="su-error" role="alert">{errors.terms_accepted[0]}</small>}
            {termsOpen && <Terms />}
          </Section>

          <div className="su-actions">
            <button type="submit" className="su-btn su-btn-primary" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        <footer className="su-footer">
          <Link to="/login">I already have an account</Link>
        </footer>
      </div>
    </div>
  );
}