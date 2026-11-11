import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/consent.css';

/**
 * Mandatory disclosure screen. Participants must read this and click
 * "I Understand & Agree" before the login/registration pages become
 * reachable. This sets a sessionStorage flag that the Login/Register
 * pages check for; it is intentionally a real gate, not decoration.
 */
export default function Consent() {
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  const proceed = () => {
    sessionStorage.setItem('phishbook_consent_ack', 'true');
    navigate('/login');
  };

  return (
    <div className="consent-page">
      <div className="consent-card">
        <h1>Welcome to PHISHBOOK</h1>
        <p className="consent-lede">
          Before you continue, please read the following notice.
        </p>

        <div className="consent-box">
          <p>
            <strong>PHISHBOOK is a controlled academic exercise</strong>,
            built to demonstrate social-media login flows, authentication,
            and activity monitoring as part of a cybersecurity and web
            development class.
          </p>
          <ul>
            <li>Anything you type into the login or registration form on this site may be recorded for the exercise (for example: the email or username you submit, the date/time, and whether a password was entered).</li>
            <li>Your actual password is <strong>never stored or displayed</strong> &mdash; only whether the password field was filled in.</li>
            <li>Please use a dummy/test account and a password you do not use anywhere else. Do not enter real third-party credentials.</li>
            <li>This activity is for authorized participants only, as part of a supervised classroom activity.</li>
            <li>An administrator (your instructor) can view aggregated activity for the purposes of this exercise.</li>
          </ul>
        </div>

        <label className="consent-checkbox">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          I understand this is a monitored academic exercise and I agree to participate using test credentials only.
        </label>

        <button className="consent-btn" disabled={!checked} onClick={proceed}>
          I Understand &amp; Agree
        </button>
      </div>
    </div>
  );
}
