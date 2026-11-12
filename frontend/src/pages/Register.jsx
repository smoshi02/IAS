import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { IconLogoMark, IconArrowLeft, IconCheck, IconEye, IconEyeOff } from '../components/Icons';
import '../styles/auth.css';
import '../styles/signup.css';

/**
 * Multi-step sign-up flow:
 *   1 name -> 2 birthday -> 3 gender -> 4 contact (mobile or email)
 *   -> 5 password -> 6 terms (submits the account)
 */
const TOTAL_STEPS = 6;
const LAST_STEP = TOTAL_STEPS - 1;

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

// Which step to jump back to when the server rejects a field.
const FIELD_STEP = {
  first_name: 0, last_name: 0,
  birthday: 1,
  gender: 2,
  mobile_number: 3, email: 3,
  password: 4,
  terms_accepted: 5,
};

const MIN_AGE = 13;

const initialForm = {
  first_name: '', last_name: '',
  month: '', day: '', year: '',
  gender: '',
  contact_type: 'mobile',
  mobile_number: '', email: '',
  password: '', remember: false,
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

function validateStep(step, f) {
  const e = {};
  if (step === 0) {
    if (!f.first_name.trim()) e.first_name = ['Enter your first name.'];
    if (!f.last_name.trim()) e.last_name = ['Enter your last name.'];
  }
  if (step === 1) {
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
  }
  if (step === 2 && !f.gender) {
    e.gender = ['Select an option to continue.'];
  }
  if (step === 3) {
    if (f.contact_type === 'mobile') {
      if (!/^\+?[0-9]{7,15}$/.test(cleanMobile(f.mobile_number))) {
        e.mobile_number = ['Enter a valid mobile number.'];
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      e.email = ['Enter a valid email address.'];
    }
  }
  if (step === 4 && f.password.length < 8) {
    e.password = ['Your password needs at least 8 characters.'];
  }
  return e;
}

const copy = (f) => [
  {
    title: "What's your name?",
    sub: 'Enter the name you use in real life.',
  },
  {
    title: "What's your birthday?",
    sub: "Your birthday helps us confirm you're old enough to join.",
  },
  {
    title: "What's your gender?",
    sub: 'Pick the option that fits you best.',
  },
  {
    title: "What's your contact?",
    sub: f.contact_type === 'mobile'
      ? 'Enter the mobile number where you can be reached.'
      : 'Enter the email address where you can be reached.',
  },
  {
    title: 'Create a password',
    sub: 'Use at least 8 characters. Mixing letters, numbers and symbols makes it stronger.',
  },
  {
    title: 'Agree to terms and policies',
    sub: 'Please read and accept to finish creating your account.',
  },
];

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
        exercise. By tapping &ldquo;I agree&rdquo; you confirm you have read these terms and are
        joining as a participant in this activity.
      </p>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('fwd');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
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
    // Clear the error for the field being edited (and the banner) as soon as they change it.
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      delete next[name];
      delete next.general;
      if (name === 'month' || name === 'day' || name === 'year') delete next.birthday;
      return next;
    });
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  const goTo = (target, dir) => {
    setDirection(dir);
    setStep(target);
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
        const steps = Object.keys(serverErrors).map((k) => FIELD_STEP[k]).filter((s) => s !== undefined);
        if (steps.length) goTo(Math.min(...steps), 'back');
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
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (step === LAST_STEP) submit();
    else goTo(step + 1, 'fwd');
  };

  const goBack = () => {
    setErrors({});
    goTo(step - 1, 'back');
  };

  const switchContact = () => {
    setErrors({});
    setForm((f) => ({ ...f, contact_type: f.contact_type === 'mobile' ? 'email' : 'mobile' }));
  };

  const years = [];
  for (let y = new Date().getFullYear(); y >= 1900; y -= 1) years.push(y);
  const dayCount = form.month ? daysInMonth(form.month, form.year) : 31;

  const age = form.month && form.day && form.year
    ? calcAge(Number(form.year), Number(form.month), Number(form.day))
    : null;
  const strength = passwordStrength(form.password);
  const { title, sub } = copy(form)[step];

  /* ----------------------------------------------------------- success */
  if (done) {
    return (
      <div className="su-page">
        <div className="su-shell">
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

  /* -------------------------------------------------------------- flow */
  return (
    <div className="su-page">
      <div className="su-shell">
        <header className="su-header">
          {step > 0 ? (
            <button type="button" className="su-back" onClick={goBack} aria-label="Back">
              <IconArrowLeft />
            </button>
          ) : (
            <Link to="/login" className="su-back" aria-label="Back to log in">
              <IconArrowLeft />
            </Link>
          )}
          <div className="su-brand"><IconLogoMark /><span>PHISHBOOK</span></div>
          <span className="su-step-count" aria-hidden="true">{step + 1}/{TOTAL_STEPS}</span>
        </header>

        <div
          className="su-progress"
          role="progressbar"
          aria-label="Sign-up progress"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step + 1}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span key={i} className={i <= step ? 'on' : ''} />
          ))}
        </div>

        <form className={`su-step su-dir-${direction}`} key={step} onSubmit={handleSubmit} noValidate>
          <div className="su-intro">
            <h1>{title}</h1>
            <p>{sub}</p>
          </div>

          {errors.general && <div className="su-banner" role="alert">{errors.general[0]}</div>}

          {/* 1 — name */}
          {step === 0 && (
            <>
              <div className="su-note">Academic demo: please use test details, not your real personal information.</div>
              <div className="su-row">
                <Field id="su-first" name="first_name" label="First name" autoComplete="given-name" autoFocus
                  value={form.first_name} onChange={handleChange} error={errors.first_name?.[0]} />
                <Field id="su-last" name="last_name" label="Last name" autoComplete="family-name"
                  value={form.last_name} onChange={handleChange} error={errors.last_name?.[0]} />
              </div>
            </>
          )}

          {/* 2 — birthday */}
          {step === 1 && (
            <>
              <div className="su-birthday-label">
                Birthday{age !== null && age >= 0 ? <> <span>({age} years old)</span></> : null}
              </div>
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
            </>
          )}

          {/* 3 — gender */}
          {step === 2 && (
            <>
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
            </>
          )}

          {/* 4 — contact */}
          {step === 3 && (
            <>
              {form.contact_type === 'mobile' ? (
                <Field id="su-mobile" name="mobile_number" type="tel" inputMode="tel" label="Mobile number"
                  autoComplete="tel" autoFocus value={form.mobile_number} onChange={handleChange}
                  error={errors.mobile_number?.[0]} />
              ) : (
                <Field id="su-email" name="email" type="email" label="Email address"
                  autoComplete="email" autoFocus value={form.email} onChange={handleChange}
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
            </>
          )}

          {/* 5 — password */}
          {step === 4 && (
            <>
              <div className="su-field su-password">
                <input id="su-password" name="password" placeholder=" " autoFocus autoComplete="new-password"
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
            </>
          )}

          {/* 6 — terms */}
          {step === 5 && (
            <>
              <Terms />
              {errors.terms_accepted && <small className="su-error" role="alert">{errors.terms_accepted[0]}</small>}
            </>
          )}

          <div className="su-actions">
            <button type="submit" className="su-btn su-btn-primary" disabled={loading}>
              {step === LAST_STEP ? (loading ? 'Creating account...' : 'I agree') : 'Next'}
            </button>
            {step === 3 && (
              <button type="button" className="su-btn su-btn-secondary" onClick={switchContact}>
                {form.contact_type === 'mobile' ? 'Sign up with email address' : 'Sign up with mobile number'}
              </button>
            )}
          </div>
        </form>

        <footer className="su-footer">
          <Link to="/login">I already have an account</Link>
        </footer>
      </div>
    </div>
  );
}