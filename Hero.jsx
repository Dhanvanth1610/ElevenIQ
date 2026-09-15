import React from "react";

const FEATURES = [
  {
    icon: "🏆",
    title: "Real League Data",
    desc: "Live standings, fixtures and results for the Premier League, La Liga, Serie A, Bundesliga, Ligue 1 and the Champions League.",
    badge: { label: "Live data", cls: "real" },
  },
  {
    icon: "🎯",
    title: "Player Tracking",
    desc: "Upload your own club or training footage — YOLOv8 + ByteTrack detects and follows every player, frame by frame.",
    badge: { label: "Real", cls: "real" },
  },
  {
    icon: "🔥",
    title: "Team & Player Heatmaps",
    desc: "Positional density maps built from real tracked pitch coordinates — spot who's dominating which zones.",
    badge: { label: "Real", cls: "real" },
  },
  {
    icon: "🕸️",
    title: "Pass / Interaction Network",
    desc: "Proximity-based interaction graph showing which players link up most across the pitch.",
    badge: { label: "Heuristic", cls: "heuristic" },
  },
  {
    icon: "⚡",
    title: "Sprint & Fatigue Index",
    desc: "Sports-science speed thresholds (jog / run / high-intensity / sprint) plus a 1st-half vs 2nd-half fatigue drop-off score.",
    badge: { label: "Real", cls: "real" },
  },
  {
    icon: "🥅",
    title: "Expected Goals (xG) Model",
    desc: "Distance + angle-to-goal logistic model calibrated to public xG distributions — try it live in the xG Lab.",
    badge: { label: "Real baseline", cls: "real" },
  },
];

export default function Hero({ onStart }) {
  return (
    <>
      <div className="hero">
        <div className="hero-kicker">
          <span className="dot" />
          Top-5 leagues + Champions League
        </div>
        <h1>
          Follow Europe's biggest leagues, <span>then break down your own match.</span>
        </h1>
        <p className="lead">
          ElevenIQ pairs live standings, fixtures and results from the
          Premier League, La Liga, Serie A, Bundesliga, Ligue 1 and the
          Champions League with a computer-vision pipeline for your own
          footage — heatmaps, pass networks, sprint &amp; fatigue metrics,
          and an xG model.
        </p>
        <div className="hero-cta">
          <button className="btn-primary" onClick={onStart}>
            Open League Center ▶
          </button>
          <button
            className="btn-ghost"
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
          >
            See what's under the hood
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat"><b>6</b><span>Competitions covered</span></div>
          <div className="stat"><b>105×68m</b><span>Calibrated pitch model</span></div>
          <div className="stat"><b>7.0 m/s</b><span>Sprint threshold</span></div>
          <div className="stat"><b>&lt;5min</b><span>Ideal upload clip length</span></div>
        </div>
      </div>

      <div className="section-head" id="features">
        <div className="eyebrow">Platform</div>
        <h2>Everything a football analyst needs, in one place</h2>
        <p>
          Badges show what's live league data, genuinely computed from your
          footage, or a calibrated baseline/heuristic — no smoke and mirrors.
        </p>
      </div>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div className="feature-card" key={f.title}>
            <div className="icon">{f.icon}</div>
            <h4>{f.title}</h4>
            <p>{f.desc}</p>
            <div className="badge-row">
              <span className={`badge ${f.badge.cls}`}>{f.badge.label}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
