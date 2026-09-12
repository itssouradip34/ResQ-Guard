import React, { useEffect, useState } from "react";
import "./Landing.css";

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55
      0-.27-.01-1.16-.02-2.11-3.16.69-3.83-1.34-3.83-1.34-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69
      1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.52-.29-5.17-1.26-5.17-5.6
      0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0
      c2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.65 5.31-5.18 5.59
      .41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.2.66.79.55A11.26 11.26 0 0 0 23.25 11.75
      C23.25 5.48 18.27.5 12 .5Z"/>
  </svg>
);

// Small shield-pulse mark for the brand badge that covers the video watermark
const ShieldPulseIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M12 2.5 4.5 5.2v6.1c0 5.1 3.2 8.9 7.5 10.2 4.3-1.3 7.5-5.1 7.5-10.2V5.2L12 2.5Z"
      fill="none"
      stroke="url(#brandGrad)"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 12.5h3l1.4-3 2.2 6 1.4-3h3"
      fill="none"
      stroke="url(#brandGrad)"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="brandGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#22d3ee" />
        <stop offset="1" stopColor="#ffb238" />
      </linearGradient>
    </defs>
  </svg>
);

interface LandingProps {
  onGetStarted: () => void;
  onViewTeam: () => void;
}

// How long the wordmark frame holds before fading out (ms)
const INTRO_HOLD_MS = 2600;
// How long the fade-out transition itself takes (ms) — keep in sync with CSS
const INTRO_FADE_MS = 700;

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onViewTeam }) => {
  const cameras = ["CAM_01", "CAM_02", "CAM_03", "CAM_04", "CAM_05", "CAM_06"];

  // true while the intro wordmark frame should render at all (including its fade-out)
  const [showIntro, setShowIntro] = useState(true);
  // true once the fade-out animation should be playing
  const [introExiting, setIntroExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setIntroExiting(true), INTRO_HOLD_MS);
    const removeTimer = setTimeout(
      () => setShowIntro(false),
      INTRO_HOLD_MS + INTRO_FADE_MS
    );
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div className="gate">
      <video
        className="gate__video"
        autoPlay
        muted
        loop
        playsInline
        poster="/landing-poster.jpg"
      >
        <source src="/landing-bg.webm" type="video/webm" />
        <source src="/landing-bg.mp4" type="video/mp4" />
      </video>

      <div className="gate__grid" aria-hidden="true">
        {Array.from({ length: 48 }).map((_, i) => (
          <span key={i} className="gate__cell" />
        ))}
      </div>

      {/* Top-right corner cluster: tagline + buttons, then GitHub icon */}
      <div className="gate__topright">
        {!showIntro && (
          <div className="gate__content gate__content--enter">
            <p className="gate__tagline gate__tagline--compact">
              City-wide vehicle intelligence, tracked and resolved in real time.
            </p>
            <div className="gate__actions gate__actions--compact">
              <button className="gate__btn gate__btn--solid" onClick={onGetStarted}>
                Get started
              </button>
              <button className="gate__btn gate__btn--outline" onClick={onViewTeam}>
                Our team
              </button>
            </div>
          </div>
        )}

        <a
          className="gate__github"
          href="https://github.com/itssouradip34/ResQ-Guard"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View ResQ-Guard on GitHub"
        >
          <GithubIcon />
        </a>
      </div>

      <main className="gate__main">
        {/* Wordmark frame — shows once for 2-3s, then disappears for good */}
        {showIntro && (
          <div className={"gate__frame" + (introExiting ? " gate__frame--exit" : " gate__frame--enter")}>
            <span className="gate__corner gate__corner--tl" />
            <span className="gate__corner gate__corner--tr" />
            <span className="gate__corner gate__corner--bl" />
            <span className="gate__corner gate__corner--br" />
            <h1 className="gate__wordmark">RESQ-GUARD</h1>
          </div>
        )}
      </main>

      {/* Brand chip covering the video's baked-in bottom-right watermark */}
      <div className="gate__brandbadge" aria-hidden="true">
        <ShieldPulseIcon />
        <span className="gate__brandbadge-text">
          <span className="gate__brandbadge-label">POWERED BY</span>
          <span className="gate__brandbadge-name">RESQ-GUARD</span>
        </span>
      </div>

      <footer className="gate__ticker">
        <span className="gate__dot" aria-hidden="true" />
        <span className="gate__ticker-label">STATUS: ONLINE</span>
        <span className="gate__ticker-sep">/</span>
        {cameras.map((cam) => (
          <span key={cam} className="gate__ticker-item">{cam}</span>
        ))}
      </footer>
    </div>
  );
};

export default Landing;
