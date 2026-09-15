import React, { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";
const PITCH_L = 105;
const PITCH_W = 68;
const GOAL_Y = 34;

const PRESETS = [
  { label: "Penalty spot", x: 94, y: 34, is_penalty: true, is_header: false },
  { label: "Edge of box, central", x: 87, y: 34, is_penalty: false, is_header: false },
  { label: "Tight angle", x: 101, y: 10, is_penalty: false, is_header: false },
  { label: "Far post header", x: 100, y: 30, is_penalty: false, is_header: true },
  { label: "Long range", x: 70, y: 34, is_penalty: false, is_header: false },
];

export default function XgLab() {
  const [shot, setShot] = useState({ x_m: 90, y_m: 34, is_header: false, is_penalty: false });
  const [xg, setXg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const predict = async (nextShot) => {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await axios.post(`${API_BASE}/xg/predict`, nextShot);
      setXg(data.xg);
    } catch (e) {
      setErr(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePitchClick = (evt) => {
    const svg = evt.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xFrac = (evt.clientX - rect.left) / rect.width;
    const yFrac = (evt.clientY - rect.top) / rect.height;
    const x_m = Math.round(Math.min(Math.max(xFrac * PITCH_L, 0), PITCH_L) * 10) / 10;
    const y_m = Math.round(Math.min(Math.max(yFrac * PITCH_W, 0), PITCH_W) * 10) / 10;
    const nextShot = { x_m, y_m, is_header: shot.is_header, is_penalty: false };
    setShot(nextShot);
    predict(nextShot);
  };

  const applyPreset = (p) => {
    const nextShot = { x_m: p.x, y_m: p.y, is_header: p.is_header, is_penalty: p.is_penalty };
    setShot(nextShot);
    predict(nextShot);
  };

  const toggleHeader = () => {
    const nextShot = { ...shot, is_header: !shot.is_header };
    setShot(nextShot);
    if (xg !== null) predict(nextShot);
  };

  return (
    <>
      <div className="section-head">
        <div className="eyebrow">Expected Goals</div>
        <h2>xG Lab — click anywhere on the pitch</h2>
        <p>
          Place a shot and ElevenIQ's baseline xG model (distance + angle to goal,
          logistic-calibrated to public xG distributions) returns the probability
          it's a goal.
        </p>
      </div>

      <div className="xg-layout">
        <div className="xg-pitch-wrap">
          <svg
            viewBox={`0 0 ${PITCH_L} ${PITCH_W}`}
            width="100%"
            onClick={handlePitchClick}
            style={{ cursor: "crosshair", background: "#081321", borderRadius: 12 }}
          >
            <rect x="1" y="1" width={PITCH_L - 2} height={PITCH_W - 2} fill="none" stroke="#26355f" strokeWidth="0.6" />
            <circle cx={PITCH_L / 2} cy={PITCH_W / 2} r="9.15" fill="none" stroke="#26355f" strokeWidth="0.5" />
            <line x1={PITCH_L / 2} y1="0" x2={PITCH_L / 2} y2={PITCH_W} stroke="#26355f" strokeWidth="0.4" />
            {/* penalty box + 6-yard box (attacking, right side) */}
            <rect x={PITCH_L - 16.5} y={PITCH_W / 2 - 20.15} width="16.5" height="40.3" fill="none" stroke="#26355f" strokeWidth="0.5" />
            <rect x={PITCH_L - 5.5} y={PITCH_W / 2 - 9.16} width="5.5" height="18.32" fill="none" stroke="#26355f" strokeWidth="0.4" />
            {/* goal */}
            <line x1={PITCH_L} y1={GOAL_Y - 3.66} x2={PITCH_L} y2={GOAL_Y + 3.66} stroke="#d8b36a" strokeWidth="1.4" />
            {/* shot marker */}
            <circle cx={shot.x_m} cy={shot.y_m} r="2" fill="#5b7bff" stroke="#04060f" strokeWidth="0.4" />
            <line x1={shot.x_m} y1={shot.y_m} x2={PITCH_L} y2={GOAL_Y} stroke="#5b7bff" strokeWidth="0.3" strokeDasharray="1.2,1" opacity="0.6" />
          </svg>
          <div className="xg-preset-row">
            {PRESETS.map((p) => (
              <button key={p.label} className="xg-preset" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>
          <p className="xg-hint">
            Goal sits on the right edge (x = 105m). Toggle header below, or click
            the pitch again to place a new shot.
          </p>
        </div>

        <div className="xg-readout">
          {loading ? (
            <p className="subtitle">Calculating…</p>
          ) : err ? (
            <p style={{ color: "#ff5d73" }}>{err}</p>
          ) : xg !== null ? (
            <>
              <div className="xg-value">{(xg * 100).toFixed(1)}%</div>
              <div className="xg-caption">Expected Goals (xG) for this shot</div>
            </>
          ) : (
            <div className="empty-state">
              <div className="emoji">🥅</div>
              Click the pitch or pick a preset to get an xG reading.
            </div>
          )}
          <button className="xg-preset" style={{ marginTop: 18 }} onClick={toggleHeader}>
            {shot.is_header ? "✓ Header shot" : "Mark as header"}
          </button>
        </div>
      </div>
    </>
  );
}
