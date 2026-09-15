import React from "react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "leagues", label: "League Center" },
  { id: "match", label: "Match Center" },
  { id: "xg", label: "xG Lab" },
];

export default function Nav({ active, onChange }) {
  return (
    <div className="topnav">
      <div className="brand">
        <span className="ball">★</span>Eleven<span>IQ</span>
      </div>
      <div className="nav-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={active === t.id ? "active" : ""}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
