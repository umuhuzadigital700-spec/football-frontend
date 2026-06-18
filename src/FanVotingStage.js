import React, { useState, useEffect, useCallback, useMemo } from "react";

function parseTypeBPlayers(str) {
  if (!str || typeof str !== "string") return [];
  return str
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(entry => {
      const match = entry.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
      if (match) return { name: match[1].trim(), role: match[2].trim() };
      return { name: entry, role: "" };
    });
}

function parseTypeAPlayers(tacticsInput) {
  let tactics = tacticsInput;
  if (typeof tacticsInput === "string") {
    try {
      tactics = JSON.parse(tacticsInput);
    } catch {
      return [];
    }
  }

  if (!tactics || typeof tactics !== "object") return [];

  return Object.values(tactics)
    .filter(Boolean)
    .map(p => ({
      name: p.name || p.playerName || p.Name || "Unknown",
      role: p.position || p.pos || p.role || "",
    }));
}

function ScoreInput({ name, role, value, onChange, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ flex: 1, fontSize: 13 }}>
        {name} {role && <small style={{ color: "#888" }}>({role})</small>}
      </span>
      <input
        type="number"
        min={0}
        max={10}
        step={0.5}
        value={value}
        onChange={e => onChange(name, Number(e.target.value))}
        disabled={disabled}
        style={{ width: 60, padding: 4, textAlign: "center" }}
      />
    </div>
  );
}

function FanVotingStage({ socket, gameState, myTxId, isReferee }) {
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [coachVote, setCoachVote] = useState("");
  const [scores, setScores] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [ballotData, setBallotData] = useState(null);
  const [ballotLoading, setBallotLoading] = useState(false);

  useEffect(() => {
    function onBallotResult({ success, error }) {
      if (success) {
        setSubmitStatus("ok");
        setSubmitError("");
      } else {
        setSubmitStatus("error");
        setSubmitError(
          error === "ALREADY_VOTED"
            ? "You have already voted on this match."
            : error === "MATCH_CLOSED"
              ? "This match is no longer open for voting."
              : error === "NOT_VERIFIED"
                ? "Your ticket could not be verified."
                : "Submission failed. Please try again."
        );
      }
    }

    function onRefBallotData({ matchId, ballots, error }) {
      setBallotLoading(false);
      if (error) {
        setBallotData({ error });
      } else {
        setBallotData({ matchId, ballots });
      }
    }

    socket.on("ballotResult", onBallotResult);
    socket.on("refBallotData", onRefBallotData);

    return () => {
      socket.off("ballotResult", onBallotResult);
      socket.off("refBallotData", onRefBallotData);
    };
  }, [socket]);

  const votingMatches = useMemo(() => gameState?.votingMatches || [], [gameState?.votingMatches]);

  const openMatches = useMemo(
    () => votingMatches.filter(m => m.status === "OPEN"),
    [votingMatches]
  );

  const selectedMatch = useMemo(
    () => votingMatches.find(m => String(m.matchId) === String(selectedMatchId)),
    [votingMatches, selectedMatchId]
  );

  const t1Players = useMemo(() => {
    if (!selectedMatch) return [];
    return selectedMatch.matchType === "A"
      ? parseTypeAPlayers(selectedMatch.t1Tactics)
      : parseTypeBPlayers(selectedMatch.team1Players);
  }, [selectedMatch]);

  const t2Players = useMemo(() => {
    if (!selectedMatch) return [];
    return selectedMatch.matchType === "A"
      ? parseTypeAPlayers(selectedMatch.t2Tactics)
      : parseTypeBPlayers(selectedMatch.team2Players);
  }, [selectedMatch]);

  const allPlayers = useMemo(() => [...t1Players, ...t2Players], [t1Players, t2Players]);

  const handleScoreChange = useCallback((name, val) => {
    setScores(prev => ({ ...prev, [name]: val }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedMatchId || !coachVote) {
      return alert("Select a coach vote before submitting.");
    }

    setSubmitStatus("pending");
    setSubmitError("");
    socket.emit("fanSubmitBallot", {
      txId: myTxId,
      matchId: selectedMatchId,
      coachVote,
      scores
    });
  }, [socket, myTxId, selectedMatchId, coachVote, scores]);

  const handleToggleStatus = useCallback((matchId, matchType, currentStatus) => {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    socket.emit("refToggleVotingStatus", { matchId, matchType, newStatus });
  }, [socket]);

  const handleGetBallots = useCallback((matchId) => {
    setBallotData(null);
    setBallotLoading(true);
    socket.emit("refGetBallots", { matchId });
  }, [socket]);

  const handleRefreshMatches = useCallback(() => {
    socket.emit("refRefreshVotingMatches");
  }, [socket]);

  return (
    <div style={{ border: "2px solid #7b1fa2", borderRadius: 8, padding: 16, marginTop: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12
        }}
      >
        <h2 style={{ margin: 0 }}>🗳️ Fan Voting Stage</h2>
        {isReferee && (
          <button onClick={handleRefreshMatches} style={{ padding: "6px 12px", fontSize: 12 }}>
            🔄 Refresh Matches
          </button>
        )}
      </div>

      {isReferee && votingMatches.length > 0 && (
        <section style={{ marginBottom: 20, background: "#f3e5f5", borderRadius: 6, padding: 12 }}>
          <h3 style={{ margin: "0 0 8px" }}>Voting Manager</h3>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#555" }}>
            Toggle a match to OPEN to allow fans to vote. Toggling does NOT affect the draft canvas.
          </p>

          {votingMatches.map(m => (
            <div
              key={m.matchId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 0",
                borderBottom: "1px solid #e1bee7"
              }}
            >
              <span style={{ flex: 1, fontSize: 13 }}>
                <strong>{m.name}</strong> <small>({m.matchType === "A" ? "Live" : "Manual"})</small>
              </span>

              <span
                style={{
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: "bold",
                  background: m.status === "OPEN" ? "#e8f5e9" : "#ffebee",
                  color: m.status === "OPEN" ? "#2e7d32" : "#c62828"
                }}
              >
                {m.status}
              </span>

              <button
                onClick={() => handleToggleStatus(m.matchId, m.matchType, m.status)}
                style={{ padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
              >
                {m.status === "OPEN" ? "Close" : "Open"}
              </button>

              <button
                onClick={() => handleGetBallots(m.matchId)}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  background: "#e3f2fd"
                }}
              >
                📊 Ballots
              </button>
            </div>
          ))}

          {ballotLoading && <p stylding && <p styl
