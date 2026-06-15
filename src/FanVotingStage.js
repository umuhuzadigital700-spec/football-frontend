import React, { useState, useEffect, useCallback, useMemo } from "react"; 

function parseTypeBPlayers(str) {
  if (!str || typeof str !== "string") return []; 
  return str.split(",").map(s => s.trim()).filter(Boolean).map(entry => { 
    const match = entry.match(/^(.*?)\s*\(([^)]+)\)\s*$/); 
    if (match) return { name: match[1].trim(), role: match[2].trim() }; 
    return { name: entry, role: "" }; 
  });
}

function parseTypeAPlayers(tacticsInput) {
  let tactics = tacticsInput; 
  if (typeof tacticsInput === "string") { 
    try { tactics = JSON.parse(tacticsInput); } catch { return []; } 
  }
  if (!tactics || typeof tactics !== "object") return []; 
  return Object.values(tactics).filter(Boolean).map(p => ({ 
    name: p.name || p.playerName || p.Name || "Unknown",
    role: p.position || p.pos || p.role || ""
  }));
}

function ScoreInput({ name, role, value, onChange, disabled }) { 
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.55rem 0.875rem", borderRadius: "8px", background: "#f3f0ec", border: "1px solid #d4d1ca", opacity: disabled ? 0.6 : 1, color: "#333" }}> 
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: "0.88rem", fontWeight: 600, marginRight: "0.35rem" }}>{name}</span> 
        {role && <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", padding: "1px 5px", borderRadius: "999px", background: "#cedcd8", color: "#01696f" }}>{role}</span>} 
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}> 
        <input type="range" min={1} max={10} value={value} onChange={e => onChange(name, Number(e.target.value))} disabled={disabled} style={{ width: "90px", accentColor: "#01696f" }} /> 
        <input type="number" min={1} max={10} value={value} onChange={e => onChange(name, Math.min(10, Math.max(1, Number(e.target.value) || 1)))} disabled={disabled} style={{ width: "46px", textAlign: "center", borderRadius: "6px", border: "1px solid #d4d1ca", color: "#333" }} /> 
      </div>
    </div>
  );
}

export default function FanVotingStage({ socket, gameState, currentUser }) { 
  const [selectedMatchId, setSelectedMatchId] = useState(""); 
  const [coachVote, setCoachVote] = useState(""); 
  const [scores, setScores] = useState({}); 
  const [submitting, setSubmitting] = useState(false); 
  const [result, setResult] = useState(null); 
  const [votedMatchIds, setVotedMatchIds] = useState({}); 

  const votingMatches = gameState?.votingMatches || []; 
  const openMatches = useMemo(() => votingMatches.filter(m => m.status === "OPEN"), [votingMatches]); 
  const selectedMatch = useMemo(() => votingMatches.find(m => String(m.matchId) === String(selectedMatchId)) || null, [votingMatches, selectedMatchId]); 

  const { allPlayers } = useMemo(() => { 
    if (!selectedMatch) return { team1Players: [], team2Players: [], allPlayers: [] }; 
    const t1 = selectedMatch.matchType === "B" ? parseTypeBPlayers(selectedMatch.team1Players) : parseTypeAPlayers(selectedMatch.t1Tactics); 
    const t2 = selectedMatch.matchType === "B" ? parseTypeBPlayers(selectedMatch.team2Players) : parseTypeAPlayers(selectedMatch.t2Tactics); 
    return { team1Players: t1, team2Players: t2, allPlayers: [...t1, ...t2] }; 
  }, [selectedMatch]);

  useEffect(() => { 
    setCoachVote(""); setResult(null); 
    if (!selectedMatch) { setScores({}); return; } 
    const init = {}; 
    allPlayers.forEach(p => { init[p.name] = 5; }); 
    setScores(init); 
  }, [selectedMatchId, allPlayers]);

  useEffect(() => { 
    if (!socket) return; 
    const handler = ({ success, error }) => {
      setSubmitting(false); 
      if (success) {
        setResult("ok"); 
        setVotedMatchIds(prev => ({ ...prev, [selectedMatchId]: true }));
      } else {
        setResult(error || "SERVER_ERROR"); 
        if (error === "ALREADY_VOTED") setVotedMatchIds(prev => ({ ...prev, [selectedMatchId]: true })); 
      }
    };
    socket.on("ballotResult", handler); 
    return () => socket.off("ballotResult", handler); 
  }, [socket, selectedMatchId]);

  const isMatchClosed = selectedMatch && selectedMatch.status !== "OPEN"; 
  const alreadyVoted = !!votedMatchIds[selectedMatchId]; 
  const isFormDisabled = isMatchClosed || alreadyVoted || submitting; 

  const handleSubmit = () => {
    if (isFormDisabled || !coachVote || !currentUser?.txId) return; 
    setSubmitting(true); 
    socket.emit("fanSubmitBallot", { txId: currentUser.txId, matchId: selectedMatchId, coachVote, scores }); 
  };

  return (
    <div style={{ padding: "1.5rem", background: "#f9f8f5", borderRadius: "12px", border: "1px solid #d4d1ca", maxWidth: "600px", margin: "20px auto", color: "#333" }}>
      <h3 style={{ margin: "0 0 1rem 0", color: "#01696f" }}>Amatora / Voting Stage</h3>
      
      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Hitamo Umukino / Select Match:</label>
      <select value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #d4d1ca", background: "#fff", color: "#333" }}>
        <option value="">-- Hitamo --</option>
        {openMatches.map(m => (
          <option key={m.matchId} value={m.matchId}>{m.name}</option>
        ))}
      </select>

      {selectedMatch && (
        <div>
          {alreadyVoted && (
            <div style={{ background: "#e0ced7", color: "#a12c7b", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", fontWeight: 600 }}>
              Wamaze gutorera muri uyu mukino / You have already voted in this match. 
            </div>
          )}

          {result === "ok" && <div style={{ background: "#d4dfcc", color: "#437a22", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>Urakoze gutorera uyu mukino! / Vote Saved!</div>}

          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f3f0ec", borderRadius: "8px" }}>
            <span style={{ display: "block", marginBottom: "0.75rem", fontWeight: 700 }}>Ninde watoje neza? / Who coached better?</span>
            <label style={{ marginRight: "1.5rem", cursor: "pointer" }}>
              <input type="radio" name="coach" value="1" checked={coachVote === "1"} onChange={() => setCoachVote("1")} disabled={isFormDisabled} /> {selectedMatch.coach1 || "Coach 1"}
            </label>
            <label style={{ cursor: "pointer" }}>
              <input type="radio" name="coach" value="2" checked={coachVote === "2"} onChange={() => setCoachVote("2")} disabled={isFormDisabled} /> {selectedMatch.coach2 || "Coach 2"}
            </label>
          </div>

          <h4 style={{ margin: "1.5rem 0 0.75rem 0" }}>Abakinnyi / Rate Participants (1–10):</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {allPlayers.map(p => (
              <ScoreInput key={p.name} name={p.name} role={p.role} value={scores[p.name] || 5} onChange={(name, val) => setScores(prev => ({ ...prev, [name]: val }))} disabled={isFormDisabled} /> 
            ))}
          </div>

          <button onClick={handleSubmit} disabled={isFormDisabled || !coachVote} style={{ width: "100%", padding: "1rem", marginTop: "1.5rem", background: "#01696f", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: isFormDisabled ? "not-allowed" : "pointer" }}>
            {submitting ? "Guposta..." : "Ohereza Amahitamo / Submit Ballot"}
          </button>
        </div>
      )}
    </div>
  );
}
