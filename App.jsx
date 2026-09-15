import React, { useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import LeagueCenter from "./components/LeagueCenter";
import UploadForm from "./components/UploadForm";
import Dashboard from "./components/Dashboard";
import XgLab from "./components/XgLab";
import Footer from "./components/Footer";

export default function App() {
  const [tab, setTab] = useState("overview");
  const [jobId, setJobId] = useState(null);

  const goToLeagueCenter = () => setTab("leagues");

  return (
    <div className="app-shell">
      <Nav active={tab} onChange={setTab} />

      {tab === "overview" && <Hero onStart={goToLeagueCenter} />}

      {tab === "leagues" && <LeagueCenter />}

      {tab === "match" && (
        <>
          <div className="section-head" style={{ marginTop: 8 }}>
            <div className="eyebrow">Match Center</div>
            <h2>Analyze your own club or training footage</h2>
            <p>
              This is separate from League Center's live data — upload a
              fixed-camera clip of your own match or session to get a
              heatmap, pass network, average formation, sprint leaderboard
              and fatigue index generated straight from the footage.
            </p>
          </div>
          <UploadForm onJobStarted={setJobId} />
          <Dashboard jobId={jobId} />
        </>
      )}

      {tab === "xg" && <XgLab />}

      <Footer />
    </div>
  );
}
