import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

const LEAGUES = [
  { code: "PL", label: "Premier League", country: "England" },
  { code: "PD", label: "La Liga", country: "Spain" },
  { code: "SA", label: "Serie A", country: "Italy" },
  { code: "BL1", label: "Bundesliga", country: "Germany" },
  { code: "FL1", label: "Ligue 1", country: "France" },
  { code: "CL", label: "Champions League", country: "Europe" },
];

function StandingsTable({ table }) {
  if (!table?.length) {
    return (
      <div className="empty-state">
        <div className="emoji">📊</div>
        No standings returned for this competition yet.
      </div>
    );
  }
  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>GD</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {table.map((row) => (
          <tr key={row.team}>
            <td><span className="jersey">{row.rank}</span></td>
            <td>{row.team}</td>
            <td>{row.played}</td>
            <td>{row.won}</td>
            <td>{row.draw}</td>
            <td>{row.lost}</td>
            <td>{row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}</td>
            <td style={{ fontWeight: 700 }}>{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MatchList({ matches, emptyLabel }) {
  if (!matches?.length) {
    return (
      <div className="empty-state">
        <div className="emoji">🗓️</div>
        {emptyLabel}
      </div>
    );
  }
  return (
    <div>
      {matches.slice(0, 12).map((m) => (
        <div className="interaction-row" key={m.id}>
          <span className="pair" style={{ minWidth: 190 }}>
            {m.home} vs {m.away}
          </span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-display)", fontWeight: 700 }}>
            {m.home_score !== null && m.away_score !== null
              ? `${m.home_score} – ${m.away_score}`
              : new Date(m.utc_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LeagueCenter() {
  const [league, setLeague] = useState("PL");
  const [standings, setStandings] = useState(null);
  const [results, setResults] = useState(null);
  const [fixtures, setFixtures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (code) => {
    setLoading(true);
    setError(null);
    setStandings(null);
    setResults(null);
    setFixtures(null);
    try {
      const [s, r, f] = await Promise.all([
        axios.get(`${API_BASE}/leagues/${code}/standings`),
        axios.get(`${API_BASE}/leagues/${code}/results`),
        axios.get(`${API_BASE}/leagues/${code}/fixtures`),
      ]);
      setStandings(s.data);
      setResults(r.data);
      setFixtures(f.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(league);
  }, [league, load]);

  return (
    <>
      <div className="section-head">
        <div className="eyebrow">League Center</div>
        <h2>Real standings, fixtures & results</h2>
        <p>
          Live from football-data.org — covering the Premier League, La Liga,
          Serie A, Bundesliga, Ligue 1 and the Champions League.
        </p>
      </div>

      <div className="sort-row" style={{ marginBottom: 20 }}>
        {LEAGUES.map((l) => (
          <button
            key={l.code}
            className={`sort-chip ${league === l.code ? "active" : ""}`}
            onClick={() => setLeague(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="upload-card" style={{ borderColor: "rgba(233,196,106,0.4)" }}>
          <h3 style={{ color: "var(--gold)" }}>League data isn't wired up yet</h3>
          <p className="subtitle" style={{ marginBottom: 0 }}>{error}</p>
        </div>
      )}

      {loading && !error && (
        <div className="upload-card">
          <p className="status-line">
            <span className="pulse" />
            Loading {LEAGUES.find((l) => l.code === league)?.label}…
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="card">
            <div className="card-head">
              <h3>🏆 {standings?.competition || "Standings"}</h3>
              <span className="tag">{standings?.season ? `${standings.season}/${+standings.season + 1}` : ""}</span>
            </div>
            <StandingsTable table={standings?.table} />
          </div>

          <div className="grid" style={{ marginTop: 20 }}>
            <div className="card">
              <div className="card-head">
                <h3>📋 Recent Results</h3>
                <span className="tag">Latest finished matches</span>
              </div>
              <MatchList matches={results?.matches} emptyLabel="No finished matches returned yet." />
            </div>
            <div className="card">
              <div className="card-head">
                <h3>🗓️ Upcoming Fixtures</h3>
                <span className="tag">Next scheduled matches</span>
              </div>
              <MatchList matches={fixtures?.matches} emptyLabel="No upcoming fixtures returned yet." />
            </div>
          </div>
        </>
      )}
    </>
  );
}
