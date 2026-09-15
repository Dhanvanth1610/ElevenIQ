import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";
const PITCH_L = 105;
const PITCH_W = 68;

const SORT_OPTIONS = [
  { id: "total_distance_m", label: "Distance" },
  { id: "sprint_count", label: "Sprints" },
  { id: "max_speed_ms", label: "Top Speed" },
  { id: "fatigue_index", label: "Fatigue" },
];

function FormationPitch({ avgPositions }) {
  const ids = Object.keys(avgPositions || {});
  if (!ids.length) return null;

  return (
    <div className="pitch-svg-wrap">
      <svg viewBox={`0 0 ${PITCH_L} ${PITCH_W}`} width="100%">
        <rect x="0" y="0" width={PITCH_L} height={PITCH_W} fill="#081321" />
        <rect x="1" y="1" width={PITCH_L - 2} height={PITCH_W - 2} fill="none" stroke="#26355f" strokeWidth="0.6" />
        <line x1={PITCH_L / 2} y1="0" x2={PITCH_L / 2} y2={PITCH_W} stroke="#26355f" strokeWidth="0.5" />
        <circle cx={PITCH_L / 2} cy={PITCH_W / 2} r="9.15" fill="none" stroke="#26355f" strokeWidth="0.5" />
        <rect x="0" y={PITCH_W / 2 - 20.15} width="16.5" height="40.3" fill="none" stroke="#26355f" strokeWidth="0.5" />
        <rect x={PITCH_L - 16.5} y={PITCH_W / 2 - 20.15} width="16.5" height="40.3" fill="none" stroke="#26355f" strokeWidth="0.5" />
        {ids.map((pid) => {
          const p = avgPositions[pid];
          const x = Math.min(Math.max(p.x_m, 1), PITCH_L - 1);
          const y = Math.min(Math.max(p.y_m, 1), PITCH_W - 1);
          return (
            <g key={pid}>
              <circle cx={x} cy={y} r="2.4" fill="#5b7bff" stroke="#081321" strokeWidth="0.4" />
              <text x={x} y={y + 4.4} fontSize="2.6" fill="#93a89c" textAnchor="middle">
                #{pid}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function FatigueRing({ value, label }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  const color = pct >= 40 ? "#ff5d73" : pct >= 20 ? "#d8b36a" : "#5b7bff";
  const style = {
    background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div className="fatigue-item">
      <div className="ring" style={style}>
        <div
          style={{
            width: "78%",
            height: "78%",
            borderRadius: "50%",
            background: "#080c22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {pct}%
        </div>
      </div>
      <div className="plabel">#{label}</div>
    </div>
  );
}

export default function Dashboard({ jobId }) {
  const [status, setStatus] = useState("queued");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState("total_distance_m");
  const pollRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    setResults(null);
    setError(null);
    setStatus("queued");

    const poll = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/status/${jobId}`);
        setStatus(data.status);
        if (data.status === "done") {
          const res = await axios.get(`${API_BASE}/results/${jobId}`);
          setResults(res.data);
          clearInterval(pollRef.current);
        } else if (data.status === "failed") {
          setError(data.error);
          clearInterval(pollRef.current);
        }
      } catch (err) {
        setError(err.message);
        clearInterval(pollRef.current);
      }
    };

    pollRef.current = setInterval(poll, 3000);
    poll();
    return () => clearInterval(pollRef.current);
  }, [jobId]);

  const playerIds = useMemo(
    () => Object.keys(results?.player_metrics || {}),
    [results]
  );

  const sortedIds = useMemo(() => {
    if (!results) return [];
    return [...playerIds].sort(
      (a, b) => results.player_metrics[b][sortKey] - results.player_metrics[a][sortKey]
    );
  }, [playerIds, results, sortKey]);

  const topInteractions = useMemo(() => {
    if (!results?.pass_network_edges) return [];
    const entries = Object.entries(results.pass_network_edges);
    const max = Math.max(1, ...entries.map(([, w]) => w));
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([pair, w]) => ({ pair: pair.replace("-", " ↔ #"), weight: w, pct: (w / max) * 100 }));
  }, [results]);

  const teamTotals = useMemo(() => {
    if (!results) return null;
    const metrics = Object.values(results.player_metrics || {});
    const totalDistanceKm =
      metrics.reduce((s, m) => s + m.total_distance_m, 0) / 1000;
    const totalSprints = metrics.reduce((s, m) => s + m.sprint_count, 0);
    const avgFatigue =
      metrics.reduce((s, m) => s + m.fatigue_index, 0) / (metrics.length || 1);
    const topSpeed = Math.max(0, ...metrics.map((m) => m.max_speed_ms));
    return { totalDistanceKm, totalSprints, avgFatigue, topSpeed };
  }, [results]);

  if (!jobId) return null;

  if (error) {
    return (
      <div className="card" style={{ borderColor: "rgba(224,114,95,0.4)" }}>
        <h3 style={{ color: "#ff5d73" }}>Processing failed</h3>
        <p className="subtitle" style={{ marginBottom: 0 }}>{error}</p>
      </div>
    );
  }

  if (status !== "done") {
    return (
      <div className="upload-card">
        <p className="status-line">
          <span className="pulse" />
          Status: <strong style={{ color: "#eef7f0" }}>{status}</strong> — running
          detection, tracking &amp; analytics. This can take a few minutes depending
          on clip length.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="summary-strip">
        <div className="summary-tile">
          <b>{results.num_players_tracked}</b>
          <span>Players Tracked</span>
        </div>
        <div className="summary-tile">
          <b>{teamTotals.totalDistanceKm.toFixed(1)} km</b>
          <span>Team Distance Covered</span>
        </div>
        <div className="summary-tile">
          <b>{teamTotals.totalSprints}</b>
          <span>Total Sprints</span>
        </div>
        <div className="summary-tile">
          <b>{teamTotals.topSpeed.toFixed(1)} m/s</b>
          <span>Top Recorded Speed</span>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-head">
            <h3>🔥 Team Heatmap</h3>
            <span className="tag">Real</span>
          </div>
          <img src={`${API_BASE}${results.team_heatmap_url}`} alt="Team heatmap" />
        </div>
        <div className="card">
          <div className="card-head">
            <h3>🕸️ Pass / Interaction Network</h3>
            <span className="tag">Heuristic</span>
          </div>
          <img src={`${API_BASE}${results.pass_network_url}`} alt="Pass network" />
        </div>
      </div>

      <div className="grid" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-head">
            <h3>🏟️ Average Formation</h3>
            <span className="tag">From tracking</span>
          </div>
          {results.avg_positions && Object.keys(results.avg_positions).length ? (
            <FormationPitch avgPositions={results.avg_positions} />
          ) : (
            <div className="empty-state">
              <div className="emoji">🏟️</div>
              No positional data returned for this clip yet.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>🤝 Squad Interaction Strength</h3>
            <span className="tag">Top 6 pairs</span>
          </div>
          {topInteractions.length ? (
            topInteractions.map((row) => (
              <div className="interaction-row" key={row.pair}>
                <span className="pair">#{row.pair}</span>
                <div className="interaction-bar-track">
                  <div className="interaction-bar-fill" style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="emoji">🤝</div>
              Not enough overlap detected between players.
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3>🏆 Player Leaderboard</h3>
          <span className="tag">Ranked</span>
        </div>
        <div className="sort-row">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`sort-chip ${sortKey === opt.id ? "active" : ""}`}
              onClick={() => setSortKey(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {(() => {
          const max = Math.max(1, ...sortedIds.map((pid) => results.player_metrics[pid][sortKey]));
          return sortedIds.slice(0, 8).map((pid, i) => {
            const m = results.player_metrics[pid];
            const val = m[sortKey];
            return (
              <div className="leader-row" key={pid}>
                <span className="leader-rank">{i + 1}</span>
                <div className="leader-bar-wrap">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Player #{pid}</span>
                  <div className="leader-bar-track">
                    <div className="leader-bar-fill" style={{ width: `${(val / max) * 100}%` }} />
                  </div>
                </div>
                <span className="leader-val">
                  {typeof val === "number" ? val.toFixed(sortKey === "fatigue_index" ? 2 : 1) : val}
                </span>
              </div>
            );
          });
        })()}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3>😮‍💨 Fatigue Index by Player</h3>
          <span className="tag">1st vs 2nd half drop-off</span>
        </div>
        <div className="fatigue-grid">
          {playerIds.map((pid) => (
            <FatigueRing key={pid} value={results.player_metrics[pid].fatigue_index} label={pid} />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3>📋 Full Physical Metrics</h3>
          <span className="tag">{playerIds.length} players</span>
        </div>
        <table className="stats-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Distance (m)</th>
              <th>Sprints</th>
              <th>High-Intensity (m)</th>
              <th>Avg Speed (m/s)</th>
              <th>Max Speed (m/s)</th>
              <th>Fatigue Index</th>
            </tr>
          </thead>
          <tbody>
            {playerIds.map((pid) => {
              const m = results.player_metrics[pid];
              return (
                <tr key={pid}>
                  <td><span className="jersey">{pid}</span></td>
                  <td>{m.total_distance_m}</td>
                  <td>{m.sprint_count}</td>
                  <td>{m.high_intensity_distance_m}</td>
                  <td>{m.avg_speed_ms}</td>
                  <td>{m.max_speed_ms}</td>
                  <td>{m.fatigue_index}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
