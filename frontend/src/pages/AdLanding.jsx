import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adlanding.css';

/*
 * AdLanding — where the SimAd banner redirects to.
 *
 * Stage 1 ("grid"): a fictional-brand storefront ("Shoppa" — invented
 * logo mark, placeholder products, no real brands). Clicking ANY
 * clickable element just opens another tab of this same page.
 * Nothing is purchased, read, sent, or stored.
 *
 * "Exit simulation" always works and moves to Stage 2 ("revealed"),
 * which explains the red flags.
 */

/* ---------- Inline SVG icons ---------- */
const base = { width: '1em', height: '1em', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

const BellIcon = (p) => (<svg {...base} {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>);
const HelpIcon = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>);
const GlobeIcon = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" /></svg>);
const ChevronDownIcon = (p) => (<svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>);
const SearchIcon = (p) => (<svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
const CartIcon = (p) => (<svg {...base} {...p}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>);
const PinIcon = (p) => (<svg {...base} {...p}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>);
const ChatIcon = (p) => (<svg {...base} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
const ImageIcon = (p) => (<svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg>);
const PlayIcon = (p) => (<svg {...base} fill="currentColor" stroke="none" {...p}><path d="M8 5v14l11-7z" /></svg>);
const CheckIcon = (p) => (<svg {...base} strokeWidth={3} {...p}><path d="M20 6 9 17l-5-5" /></svg>);
const ShareDotIcon = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>);
const CameraIcon = (p) => (<svg {...base} {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3" /></svg>);

/* Browser-tab favicon for the "Shoppa" storefront stage.
   Drop the image at frontend/public/shoplogo.png. */
const SHOPPA_FAVICON_URL = '/shoplogo.png';
/* Header logo shown on the storefront itself — separate image from the favicon. */
const SHOPPA_LOGO_URL = '/shoplogo2.png';

const RED_FLAGS = [
  'Urgency bait in the ad itself — "claim before it expires" — designed to get you clicking fast.',
  'Every single product tile does the exact same thing: open another tab of the same page. Real storefronts link to different, specific pages.',
  'The goal of a page like this is not to sell you anything — it is to waste your time, frustrate you, or bury your browser in tabs.',
  'A believable-looking storefront is easy to fake — visual polish is not proof a page or ad network is legitimate.',
  'Pop-up ads with a tiny, low-contrast "X" that does not close — pressing it sends you to some unrelated page (here, a random funny video), and only after several tries does it finally work. A real close button just closes, and an X that redirects you is a sign of a shady ad.',
  'The safe response to a tab-spawning page is to close the tab (or force-quit the browser) rather than keep clicking to "see what happens."',
];

const KEYWORDS = [
  'Robot Model Kit', 'Action Figure', 'Puzzle Cube', 'Graphic Hoodie',
  'Building Blocks', 'Desk Gadgets', 'Phone Stand', 'Mini Fan',
];

const PRODUCTS = [
  { name: 'Assembly Robot Model Kit 1/100 Scale Display Set', price: '1,309', sold: '36 sold', loc: 'Mainland China', discount: '-51%', color: '3A4A6B', img: '/shoppa/p1.jpg', mall: false, deal: false },
  { name: 'Speed Cube 3x3 Magnetic Smooth Puzzle', price: '409', sold: '10K+ sold', loc: 'Mainland China', discount: null, color: '2F6B5A', img: '/shoppa/p2.jpg', mall: true, deal: true, video: true },
  { name: 'Relaxed Fit Graphic Pullover Sweater', price: '1,659', sold: '33 sold', loc: 'Quezon City, Metro Manila', discount: '-2%', color: '2C2C2C', img: '/shoppa/p3.jpg', mall: true, deal: false },
  { name: 'Oversized Graphic T-Shirt Black', price: '859', sold: '276 sold', loc: 'Quezon City, Metro Manila', discount: '-4%', color: '3B3B45', img: '/shoppa/p4.jpg', mall: true, deal: false },
  { name: 'Men Embroidered Baseball Cap', price: '474', sold: '168 sold', loc: 'Quezon City, Metro Manila', discount: '-5%', color: '1F1F1F', img: '/shoppa/p5.jpg', mall: true, deal: false },
  { name: 'Relaxed Crewneck Sweatshirt Gray', price: '1,399', sold: '263 sold', loc: 'Quezon City, Metro Manila', discount: '-7%', color: '7C8088', img: '/shoppa/p6.jpg', mall: true, deal: false },
  { name: 'Precision Tool Kit Carry Pouch', price: '389', sold: '1.2K sold', loc: 'Pasig City', discount: '-37%', color: '8A5B2E', img: '/shoppa/p7.jpg', mall: false, deal: false },
  { name: 'Colored Pencils Set 120 Colors', price: '699', sold: '4K+ sold', loc: 'Makati City', discount: '-71%', color: '4B3F72', img: '/shoppa/p8.jpg', mall: false, deal: true },
  { name: 'Cute Hamster Plush Keychain', price: '129', sold: '2.5K sold', loc: 'Cebu City', discount: null, color: 'C9622B', img: '/shoppa/p9.jpg', mall: false, deal: false },
  { name: 'Rolled Oats Whole Grain 1kg', price: '189', sold: '900 sold', loc: 'Davao City', discount: null, color: '6B4226', img: '/shoppa/p10.jpg', mall: false, deal: false },
  { name: 'Remote Control Toy Car Racing', price: '549', sold: '3K+ sold', loc: 'Taguig City', discount: '-23%', color: '234E70', img: '/shoppa/p11.jpg', mall: false, deal: false },
  { name: 'Handwritten Label Sticker Pack', price: '59', sold: '7K+ sold', loc: 'Baguio City', discount: '-10%', color: '5B4B8A', img: '/shoppa/p12.jpg', mall: false, deal: false },
  { name: 'Wireless Earbuds Silicone Case Cover', price: '99', sold: '7K+ sold', loc: 'Makati City', discount: '-50%', color: '4B3F72', img: '/shoppa/p13.jpg', mall: false, deal: false },
  { name: 'Foldable Laundry Basket Large', price: '289', sold: '610 sold', loc: 'Antipolo', discount: null, color: '2F5D50', img: '/shoppa/p14.jpg', mall: false, deal: false },
  { name: 'LED Strip Lights 5m RGB Remote', price: '159', sold: '9K+ sold', loc: 'Iloilo City', discount: '-35%', color: '7A2E2E', img: '/shoppa/p15.jpg', mall: true, deal: true },
  { name: 'Non-Slip Yoga Mat 6mm', price: '499', sold: '2.2K sold', loc: 'Taguig City', discount: '-10%', color: '305B40', img: '/shoppa/p16.jpg', mall: false, deal: false },
  { name: 'Adjustable Aluminum Phone Stand', price: '129', sold: '4K+ sold', loc: 'Bacolod City', discount: '-25%', color: '5B4B8A', img: '/shoppa/p17.jpg', mall: false, deal: false },
  { name: 'Insulated Tumbler 500ml Steel', price: '349', sold: '1.8K sold', loc: 'Baguio City', discount: null, color: '8A5B2E', img: '/shoppa/p18.jpg', mall: true, deal: false },
  { name: 'Drawer Organizer Tray Set 8pc', price: '215', sold: '770 sold', loc: 'Cagayan de Oro', discount: '-18%', color: '3E5C76', img: '/shoppa/p19.jpg', mall: false, deal: true },
  { name: 'Mini Desk Fan Clip-On USB', price: '410', sold: '1.4K sold', loc: 'Pasig City', discount: '-15%', color: '234E70', img: '/shoppa/p20.jpg', mall: false, deal: false },
  { name: 'Stackable Storage Bins 3pc', price: '320', sold: '3K+ sold', loc: 'Mandaluyong', discount: '-30%', color: '6B4226', img: '/shoppa/p21.jpg', mall: true, deal: false },
  { name: 'Ceramic Pour-Over Coffee Mug', price: '249', sold: '980 sold', loc: 'Davao City', discount: null, color: 'C9622B', img: '/shoppa/p22.jpg', mall: false, deal: false },
  { name: 'Magnetic Cable Clips 6pc', price: '75', sold: '5K+ sold', loc: 'Cebu City', discount: '-20%', color: '3A3A50', img: '/shoppa/p23.jpg', mall: false, deal: true },
  { name: 'Compact Travel Organizer Pouch', price: '189', sold: '2K+ sold', loc: 'Quezon City', discount: '-45%', color: '2C2C2C', img: '/shoppa/p24.jpg', mall: true, deal: false },
];

const FOOTER = {
  service: ['Help Centre', 'Shoppa Cares', 'Payment Methods', 'ShoppaPay', 'Shoppa Coins', 'Order Tracking', 'Free Shipping', 'Return & Refund', 'Shoppa Guarantee', 'Overseas Product', 'Contact Us'],
  about: ['About Us', 'Shoppa Blog', 'Shoppa Careers', 'Policies', 'Privacy Policy', 'Shoppa Mall', 'Seller Centre', 'Flash Deals', 'Media Contact'],
  payment: ['ShoppaPay', 'PayLater', 'Bank Transfer', 'E-Wallet', 'Credit Card', 'Debit Card', 'Cash on Delivery', 'Installment', 'Gift Card'],
  logistics: ['Express A', 'Fast Lane', 'Cargo B', 'Go Express', 'Xpress D', 'Parcel Z', 'Delivery Co.'],
  social: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn'],
  regions: ['Argentina', 'Singapore', 'Indonesia', 'Thailand', 'Malaysia', 'Vietnam', 'Philippines', 'Brazil', 'México', 'Taiwan'],
};

/* Decorative QR-style placeholder (NOT a scannable code). */
function QrPlaceholder() {
  const n = 25;
  const cells = [];
  const inFinder = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (inFinder(x, y)) continue;
      if (((x * 7 + y * 13 + x * y * 3) % 5) < 2) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  const finder = (ox, oy) => (
    <g key={`${ox}-${oy}`} transform={`translate(${ox} ${oy})`}>
      <rect width="7" height="7" /><rect x="1" y="1" width="5" height="5" fill="#fff" /><rect x="2" y="2" width="3" height="3" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width="100%" height="100%" fill="#222" aria-hidden="true">
      {cells}{finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
    </svg>
  );
}

/* Fake pop-up ads. The "X" is deliberately unreliable: the first few
   presses just open another tab of this page (a decoy "link"); only
   after the required number of presses does it really close. Nothing
   is collected or sent anywhere. */
const POPUPS = [
  { title: 'Daily Brand Discounts — Tap & Win', body: 'Collect golden tickets and stand a chance to win vouchers.', cta: "Let's go", color: 'EE4D2D' },
  { title: 'Daily Brand Discounts', body: "Tap today's golden ticket for a chance to win Shoppa vouchers.", cta: "Let's go", color: 'D73F1F' },
  { title: 'Golden ticket unlocked', body: 'You have 1 golden ticket waiting. Tap to reveal your voucher.', cta: 'Reveal ticket', color: 'F2711C' },
  { title: 'Last chance to collect', body: 'Your golden tickets are about to expire. Collect them now to win vouchers!', cta: 'Collect tickets', color: 'C9382A' },
];
const FIRST_POPUP_DELAY = 3500;   // ms before the first pop-up
const NEXT_POPUP_DELAY = 6000;    // ms after one closes before the next appears
const randomClicksNeeded = () => 2 + Math.floor(Math.random() * 3); // 2–4 presses

/* Funny videos the pop-up "X" sends you to. Swap in any YouTube video IDs
   you like (the part after ?v= in the link). A bad ID just shows
   YouTube's "video unavailable" page — it can't break the app. */
const FUNNY_VIDEOS = [
  'dQw4w9WgXcQ', // classic rickroll
  'QH2-TGUlwu4', // Nyan Cat
  'dMH0bHeiRNg', // Evolution of Dance
  '_OBlgSz8sSM', // Charlie bit my finger
  'txqiwrbYGrs', // David After Dentist
  'OQSNhk5ICTI', // Double Rainbow
  'KmtzQCSh6xk', // Numa Numa
];
let lastVideo = -1;
function openRandomVideo() {
  // pick a random one, avoiding the same video twice in a row
  let i;
  do { i = Math.floor(Math.random() * FUNNY_VIDEOS.length); } while (i === lastVideo && FUNNY_VIDEOS.length > 1);
  lastVideo = i;
  window.open(`https://www.youtube.com/watch?v=${FUNNY_VIDEOS[i]}`, '_blank', 'noopener,noreferrer');
}

/* Banner art for the pop-ups: /public/images/bannerad.jpg.
   Falls back to the old gradient + title if the file is missing. */
const POPUP_BANNER = '/images/bannerad.jpg';
function PopupArt({ popup }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="shop-popup-art" style={{ background: `linear-gradient(150deg, #${popup.color}, #7A1F0C)` }}>
        <span className="shop-popup-ad">Ad</span>
        <span className="shop-popup-art-big">{popup.title}</span>
      </div>
    );
  }
  return (
    <button type="button" className="shop-popup-banner" onClick={openRandomVideo} aria-label={popup.title}>
      <img src={POPUP_BANNER} alt="" onError={() => setFailed(true)} />
      <span className="shop-popup-ad">Ad</span>
    </button>
  );
}

/* Real <img>; falls back to a gradient + SVG placeholder if the file is missing. */
function ProductImage({ src, alt, color }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="shop-card-fallback" style={{ background: `linear-gradient(160deg, #${color}, #16181D)` }}>
        <ImageIcon />
      </div>
    );
  }
  return <img className="shop-card-img" src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

function openAnotherTab() {
  // The prank: open a fresh tab at this exact URL. Nothing is read,
  // submitted, or sent anywhere — it just re-renders this same page.
  window.open(window.location.href, '_blank', 'noopener,noreferrer');
}

export default function AdLanding() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('grid');
  const [popup, setPopup] = useState(null);       // { idx, left }
  const [shake, setShake] = useState(false);
  const nextIdx = useRef(0);
  const timer = useRef(null);

  // Swap the browser tab title AND favicon to "Shoppa" while on this
  // page, and restore the real app's title/icon on the way out.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Shopee';

    const favicon = document.getElementById('favicon');
    const previousFaviconHref = favicon ? favicon.getAttribute('href') : null;
    if (favicon) {
      favicon.setAttribute('type', 'image/png');
      favicon.setAttribute('href', SHOPPA_FAVICON_URL);
    }

    return () => {
      document.title = previousTitle;
      if (favicon) {
        favicon.setAttribute('type', 'image/png');
        if (previousFaviconHref !== null) favicon.setAttribute('href', previousFaviconHref);
      }
    };
  }, []);

  // Schedule pop-ups while the storefront is showing.
  useEffect(() => {
    if (stage !== 'grid') return undefined;
    const schedule = (delay) => {
      timer.current = setTimeout(() => {
        const idx = nextIdx.current % POPUPS.length;
        nextIdx.current += 1;
        // the very first pop-up needs 3 presses; later ones 2–4
        setPopup({ idx, left: idx === 0 && nextIdx.current === 1 ? 3 : randomClicksNeeded() });
      }, delay);
    };
    if (popup === null) schedule(nextIdx.current === 0 ? FIRST_POPUP_DELAY : NEXT_POPUP_DELAY);
    return () => clearTimeout(timer.current);
  }, [stage, popup]);

  const pressClose = () => {
    if (!popup) return;
    if (popup.left > 1) {
      openRandomVideo();                // the "X" sends you to a random funny video
      setPopup({ ...popup, left: popup.left - 1 });
      setShake(true);
      setTimeout(() => setShake(false), 350);
    } else {
      setPopup(null);                   // finally closes
    }
  };

  if (stage === 'revealed') {
    return (
      <div className="adland-page">
        <div className="adland-card">
          <span className="adland-badge">Simulation Checkpoint</span>
          <h1>That storefront was part of the exercise.</h1>
          <p className="adland-intro">
            "Shoppa" is not a real store. Every product tile you clicked was wired to do the same thing:
            pop open another tab of the same page. No data was read, sent, or saved anywhere — the only
            thing being spent was your time and your patience.
          </p>

          <h2>What tipped it off</h2>
          <ul className="adland-flags">
            {RED_FLAGS.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>

          <h2>If this were real</h2>
          <p>
            Some real ad networks and shady sites use this exact pattern — endless tab-spawning or
            redirect loops — to run up ad impressions or simply frustrate you into giving up and staying
            on the page longer than you meant to. Close the tab (or force-quit the browser if it keeps
            spawning more) instead of continuing to click through.
          </p>

          <button type="button" className="adland-btn" onClick={() => navigate(-1)}>
            ← Back to where you were
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <button type="button" className="shop-exit" onClick={() => setStage('revealed')}>
        Exit simulation
      </button>

      <header className="shop-header">
        <div className="shop-topbar">
          <div className="shop-topbar-left">
            <button type="button" onClick={openAnotherTab}>Seller Centre</button>
            <span className="shop-sep" />
            <button type="button" onClick={openAnotherTab}>Start Selling</button>
            <span className="shop-sep" />
            <button type="button" onClick={openAnotherTab}>Download</button>
            <span className="shop-sep" />
            <span>Follow us on</span>
            <span className="shop-social"><ShareDotIcon /></span>
            <span className="shop-social"><CameraIcon /></span>
          </div>
          <div className="shop-topbar-right">
            <button type="button" onClick={openAnotherTab} className="shop-notif">
              <BellIcon /><span className="shop-notif-badge">9+</span> Notifications
            </button>
            <button type="button" onClick={openAnotherTab}><HelpIcon /> Help</button>
            <button type="button" onClick={openAnotherTab}><GlobeIcon /> English <ChevronDownIcon /></button>
            <button type="button" onClick={openAnotherTab} className="shop-account">
              <span className="shop-avatar" />
              <b>shopper_demo01</b>
            </button>
          </div>
        </div>

        <div className="shop-header-main">
          <div className="shop-logo">
            <img src={SHOPPA_LOGO_URL} alt="" className="shop-logo-img" />
            <span className="shop-logo-text">Shopee</span>
          </div>
          <div className="shop-search-wrap">
            <div className="shop-search">
              <input readOnly value="Everyday Deals Super Brand Day" onClick={openAnotherTab} />
              <button type="button" onClick={openAnotherTab} aria-label="Search"><SearchIcon /></button>
            </div>
            <div className="shop-keywords">
              {KEYWORDS.map((k) => (
                <button type="button" key={k} onClick={openAnotherTab}>{k}</button>
              ))}
            </div>
          </div>
          <div className="shop-cart" onClick={openAnotherTab}>
            <CartIcon /><span className="shop-cart-badge">155</span>
          </div>
        </div>
      </header>

      <div className="shop-discover">
        <span>DAILY DISCOVER</span>
      </div>

      <div className="shop-grid">
        {PRODUCTS.map((p) => (
          <button type="button" className="shop-card" key={p.name} onClick={openAnotherTab}>
            <div className="shop-card-media">
              <ProductImage src={p.img} alt={p.name} color={p.color} />
              {p.discount && <span className="shop-card-discount">{p.discount}</span>}
              {p.video && <span className="shop-card-play"><PlayIcon /></span>}
              <div className="shop-card-strip">
                <span className="shop-strip-pay">
                  <b>PayLater</b>
                  <i>0% INTEREST</i>
                </span>
                <span className="shop-strip-mega">
                  <b>MEGA</b>
                  <i>DISCOUNT</i>
                </span>
              </div>
            </div>
            <div className="shop-card-body">
              <div className="shop-card-name">
                {p.mall && <span className="shop-card-mall">Mall</span>}
                {p.name}
              </div>
              <div className="shop-card-deal-row">
                {p.deal && <span className="shop-card-deal">Sulit Deal</span>}
              </div>
              <div className="shop-card-price-row">
                <span className="shop-card-price">
                  <small>₱</small>{p.price}
                  <span className="shop-card-price-icon"><CheckIcon /></span>
                </span>
                <span className="shop-card-sold">{p.sold}</span>
              </div>
              <div className="shop-card-loc"><PinIcon /> {p.loc}</div>
            </div>
          </button>
        ))}
      </div>

      <nav className="shop-pager" aria-label="Pagination">
        <button type="button" onClick={openAnotherTab} aria-label="Previous"><ChevronDownIcon style={{ transform: 'rotate(90deg)' }} /></button>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={n === 2 ? 'is-active' : ''} onClick={openAnotherTab}>{n}</button>
        ))}
        <span className="shop-pager-dots">...</span>
        <button type="button" onClick={openAnotherTab} aria-label="Next"><ChevronDownIcon style={{ transform: 'rotate(-90deg)' }} /></button>
      </nav>

      <footer className="shop-footer">
        <div className="shop-footer-cols">
          <div>
            <h4>CUSTOMER SERVICE</h4>
            <ul>
              {FOOTER.service.map((l) => (
                <li key={l}><button type="button" className={l === 'Free Shipping' ? 'is-accent' : ''} onClick={openAnotherTab}>{l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>ABOUT SHOPPA</h4>
            <ul>
              {FOOTER.about.map((l) => (
                <li key={l}><button type="button" onClick={openAnotherTab}>{l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>PAYMENT</h4>
            <div className="shop-chips">
              {FOOTER.payment.map((l) => (<button type="button" key={l} onClick={openAnotherTab}>{l}</button>))}
            </div>
            <h4 className="shop-footer-sub">LOGISTICS</h4>
            <div className="shop-chips">
              {FOOTER.logistics.map((l) => (<button type="button" key={l} onClick={openAnotherTab}>{l}</button>))}
            </div>
          </div>
          <div>
            <h4>FOLLOW US</h4>
            <ul>
              {FOOTER.social.map((l) => (
                <li key={l}>
                  <button type="button" className="shop-social-link" onClick={openAnotherTab}>
                    <span className="shop-social-dot">{l[0]}</span>{l}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>SHOPPA APP DOWNLOAD</h4>
            <div className="shop-app">
              <button type="button" className="shop-qr" onClick={openAnotherTab} aria-label="QR code"><QrPlaceholder /></button>
              <div className="shop-app-stores">
                <button type="button" onClick={openAnotherTab}>App Store</button>
                <button type="button" onClick={openAnotherTab}>Google Play</button>
                <button type="button" onClick={openAnotherTab}>AppGallery</button>
              </div>
            </div>
          </div>
        </div>

        <div className="shop-footer-bottom">
          <span>© 2026 Shoppa. All Rights Reserved.</span>
          <span className="shop-regions">
            Country &amp; Region:
            {FOOTER.regions.map((r) => (<button type="button" key={r} onClick={openAnotherTab}>{r}</button>))}
          </span>
        </div>
      </footer>

      {popup && (
        <div className="shop-popup-overlay" role="dialog" aria-label="Advertisement">
          <div className={`shop-popup ${shake ? 'is-shaking' : ''}`}>
            <button type="button" className="shop-popup-x" onClick={pressClose} aria-label="Close">×</button>
            <PopupArt popup={POPUPS[popup.idx]} />
            <div className="shop-popup-body">
              <p>{POPUPS[popup.idx].body}</p>
              <button type="button" className="shop-popup-cta" onClick={openRandomVideo}>
                {POPUPS[popup.idx].cta}
              </button>
              <button type="button" className="shop-popup-skip" onClick={openAnotherTab}>No thanks, I don't want vouchers</button>
            </div>
          </div>
        </div>
      )}

      <button type="button" className="shop-chat" onClick={openAnotherTab}>
        <ChatIcon /> Chat
        <span className="shop-chat-badge">5</span>
      </button>
    </div>
  );
}