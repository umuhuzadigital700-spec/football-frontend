import React, { useState, useEffect } from "react";

function computeAnalytics(ballots, match) {
  if (!Array.isArray(ballots) || ballots.length === 0) {
    return { total: 0, coach1Votes: 0, coach2Votes: 0, playerRatings: [] };
  }
  const total = ballots.length;
  let coach1Votes = 0;
  const scoreAccum = {};

  for (const b of ballots) {
    if (String(b.coachVote) === "1" || (match?.coach1 && String(b.coachVote) === String(match.coach1))) { 
      coach1Votes++; 
    }
    let sMap = b.scores;
    if (typeof sMap === "string") {
      try { sMap = JSON.parse(sMap); } catch { sMap = {}; }
    }
    if (sMap && typeof sMap === "object") {
      for (const [name, rawScore] of Object.entries(sMap)) {
        const n = Number(rawScore);
        if (!isNaN(n) && n >= 1 && n <= 10) {
          if (!scoreAccum[name]) scoreAccum[name] = [];
          scoreAccum[name].push(n);
        }
      }
    }
  }

  const playerRatings = Object.entries(scoreAccum).map(([name, arr]) => ({
    name,
    avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    count: arr.length
  })).sort((a, b) => b.avg - a.avg);

  return { total, coach1Votes, coach2Votes: total - coach1Votes, playerRatings };
}

export default function RefereeDashboard({ socket, gameState, isReferee }) {
  if (!isReferee) return null; // Keeps it hidden from regular fans safely

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [ballotData, setBallotData] = useState([]);

  useEffect(() => {
    if (!socket) return;
    const handleBallots = ({ matchId, ballots }) => {
      if (selectedMatch && String(selectedMatch.matchId) === String(matchId)) {
        setBallotData(ballots);
      }
    };
    socket.on("refBallotData", handleBallots);
    return () => socket.off("refBallotData", handleBallots);
  }, [socket, selectedMatch]);

  useEffect(() => {
    if (selectedMatch && socket) {
      socket.emit("refGetBallots", { matchId: selectedMatch.matchId });
    } else {
      setBallotData([]);
    }
  }, [selectedMatch, socket]);

  const matches = gameState?.votingMatches || [];
  const analytics = computeAnalytics(ballotData, selectedMatch);

  const handleToggle = (match, currentStatus) => {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    socket.emit("refToggleVotingStatus", { matchId: match.matchId, matchType: match.matchType, newStatus });
    if (selectedMatch && String(selectedMatch.matchId) === String(match.matchId)) {
      setSelectedMatch(prev => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <div style={{ padding: "1.5rem", background: "#fff", color: "#28251d", borderRadius: "12px", border: "1px solid #d4d1ca", maxWidth: "900px", margin: "20px auto", textAlign: "left" }}>
      <h2 style={{ color: "#01696f", borderBottom: "2px solid #cedcd8", paddingBottom: "0.5rem", marginTop: 0 }}>
        Referee Control Panel
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1rem" }}>
        {/* Match List Controls */}
        <div>
          <h4 style={{ margin: "0 0 1rem 0", color: "#333" }}>Registered Match Streams</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {matches.length === 0 ? (
              <p style={{ color: "#7a7974", fontSize: "0.9rem" }}>Loading streams from backend ledger...</p>
            ) : (
              matches.map(m => (
                <div key={m.matchId} style={{ padding: "1rem", border: "1px solid #d4d1ca", borderRadius: "8px", background: selectedMatch?.matchId === m.matchId ? "#cedcd8" : "#f9f8f5" }}>
                  <div onClick={() => setSelectedMatch(m)} style={{ cursor: "pointer", fontWeight: 700, color: "#333" }}>{m.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#7a7974" }}>Type: {m.matchType} | Status: <strong style={{ color: m.status === "OPEN" ? "#437a22" : "#a13544" }}>{m.status}</strong></div>
                  <button onClick={() => handleToggle(m, m.status)} style={{ marginTop: "0.5rem", padding: "6px 12px", background: m.status === "OPEN" ? "#a13544" : "#437a22", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer" }}>
                    {m.status === "OPEN" ? "Close Voting" : "Open Voting"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <div>
          <h4 style={{ margin: "0 0 1rem 0", color: "#333" }}>Live Vote Tracking</h4>
          {selectedMatch ? (
            <div>
              <h5 style={{ margin: "0 0 1rem 0", color: "#01696f" }}>Selected: {selectedMatch.name}</h5>
              
              <div style={{ background: "#f9f8f5", border: "1px solid #d4d1ca", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#333" }}>{analytics.total}</div>
                <div style={{ fontSize: "0.75rem", color: "#7a7974", fontWeight: "bold" }}>TOTAL BALLOTS CAST</div>
              </div>

              {/* Coach Split Bars */}
              <div style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #d4d1ca", borderRadius: "8px", background: "#f9f8f5" }}>
                <span style={{ fontWeight: 700, display: "block", marginBottom: "0.5rem", color: "#333" }}>Coach Performance Split:</span>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px", color: "#333" }}>
                  <span>{selectedMatch.coach1 || "Coach 1"}: <strong>{analytics.coach1Votes}</strong></span>
                  <span><strong>{analytics.coach2Votes}</strong> : {selectedMatch.coach2 || "Coach 2"}</span>
                </div>
                <div style={{ height: "14px", background: "#d4d1ca", borderRadius: "999px", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${analytics.total > 0 ? (analytics.coach1Votes / analytics.total) * 100 : 50}%`, background: "#01696f", transition: "width 0.4s" }} />
                </div>
              </div>

              {/* Dynamic Ratings Matrix Table */}
              <h5 style={{ margin: "1rem 0 0.5rem 0", color: "#333" }}>Participant Live Grades</h5>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #dcd9d5", color: "#7a7974", textAlign: "left" }}>
                    <th style={{ padding: "6px" }}>Participant</th>
                    <th style={{ padding: "6px" }}>Avg Score</th>
                    <th style={{ padding: "6px" }}>Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.playerRatings.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: "8px 6px", color: "#7a7974", italic: "true" }}>No grades submitted yet.</td>
                    </tr>
                  ) : (
                    analytics.playerRatings.map(r => (
                      <tr key={r.name} style={{ borderBottom: "1px solid #dcd9d5", color: "#333" }}>
                        <td style={{ padding: "8px 6px", fontWeight: 500 }}>{r.name}</td>
                        <td style={{ padding: "8px 6px", fontWeight: 800, color: r.avg >= 7 ? "#437a22" : r.avg >= 5 ? "#d19900" : "#a13544" }}>{r.avg.toFixed(1)} / 10</td>
                        <td style={{ padding: "8px 6px", color: "#7a7974" }}>{r.count} votes</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "#7a7974", fontSize: "0.9rem" }}>Select a match from the left list to track live incoming scores.</p>
          )}
        </div>
      </div>
    </div>
  );
}
