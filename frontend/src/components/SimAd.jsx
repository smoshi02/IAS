import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/simad.css';

/*
 * SimAd — a clickbait-style ad banner used by the PHISHBOOK training
 * simulation. It is intentionally designed to look like an enticing
 * promotional ad (the kind used in real phishing lures) but it never
 * collects any data and never leaves the app. Clicking it always routes
 * to /sim/ad-landing, a page that immediately reveals the simulation
 * and walks through the red flags the participant just saw.
 *
 * Branded as "Shoppa" — a fictional shopping brand invented for this
 * exercise. It is not Shopee or any other real retailer.
 *
 * Red flags built into this ad on purpose: fake countdown (it is only a
 * local timer, nothing actually expires), "you've unlocked" prize
 * framing, urgency copy, and a "limited" tag.
 */

const START_SECONDS = 10 * 60;

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const pad = (n) => String(n).padStart(2, '0');

export default function SimAd({ variant = 'default' }) {
  const navigate = useNavigate();
  const [left, setLeft] = useState(START_SECONDS);

  // Purely cosmetic countdown — nothing is tied to it.
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = pad(Math.floor(left / 60));
  const ss = pad(left % 60);

  return (
    <button
      type="button"
      className={`sim-ad sim-ad-${variant}`}
      onClick={() => navigate('/sim/ad-landing')}
      aria-label="Sponsored: claim your 1,000 peso Shoppa voucher"
    >
      <span className="sim-ad-spark sim-ad-spark-1" aria-hidden="true" />
      <span className="sim-ad-spark sim-ad-spark-2" aria-hidden="true" />

      {/* voucher ticket */}
      <span className="sim-ad-ticket" aria-hidden="true">
        <span className="sim-ad-ticket-icon"><TicketIcon /></span>
        <span className="sim-ad-ticket-amt"><small>₱</small>1,000</span>
        <span className="sim-ad-ticket-off">VOUCHER</span>
      </span>

      <span className="sim-ad-body">
        <span className="sim-ad-top">
          <span className="sim-ad-tag"><BoltIcon /> Limited</span>
          <span className="sim-ad-sponsored">Sponsored</span>
        </span>

        <span className="sim-ad-headline">You've unlocked a ₱1,000 Shoppa voucher!</span>

        <span className="sim-ad-bottom">
          <span className="sim-ad-timer">
            <ClockIcon />
            <span className="sim-ad-timer-label">Expires in</span>
            <span className="sim-ad-digits">{mm}</span>
            <span className="sim-ad-colon">:</span>
            <span className="sim-ad-digits">{ss}</span>
          </span>
          <span className="sim-ad-cta">Claim now <ArrowIcon /></span>
        </span>
      </span>
    </button>
  );
}