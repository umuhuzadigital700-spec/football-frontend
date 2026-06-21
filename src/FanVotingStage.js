// src/FanVotingStage.js
import React, { useState, useEffect, useCallback } from "react";

// ── Type B player list parser ─────────────────────────────────────────────────
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

// ── Type A tactics parser — builds player list from tactics map ───────────────
function parseTypeAPlayers(tacticsInput) {
  let tactics = tacticsInput;
  if (typeof tacticsInput === "string") {
    try { tactics = JSON.parse(tacticsInput); } catch { return []; }
  }
  if (!tactics || typeof tactics !== "object") return [];
  return Object.values(tactics)
    .filter(Boolean)
    .map(p => ({
      name: p.name || p.playerName || p.Name || "Unknown",
      role: p.position || p.pos || p.role || "",
    }));
}

// ── Score slider component (Type B) ──────────────────────────────────────────
function ScoreInput({ name, role, value, onChange, disabled }) {
  return (
    <div style={{
      background: "#111",
      border: "1px solid #333",
      borderRadius: 6,
      padding: "8px 12px",
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#eee" }}>{name}</span>
          {role && <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>({role})</span>}
        </div>
        <span style={{
          fontSize: 14, fontWeight: 700,
          color: value >= 7 ? "#66bb6a" : value >= 4 ? "#f9a825" : "#ef5350",
          minWidth: 36, textAlign: "right",
        }}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={e => onChange(name, Number(e.target.value))}
        disabled={disabled}
        style={{ width: "100%", accentColor: "#4fc3f7", cursor: disabled ? "not-allowed" : "pointer" }}
      />
    </div>
  );
}

// ── Formation Slot Templates (fan display — read-only) ────────────────────────
const FORMATION_SLOTS = {
  '4-4-2': [
    { label: 'GK',  top: 88, left: 50 },
    { label: 'LB',  top: 70, left: 15 },
    { label: 'CB1', top: 70, left: 35 },
    { label: 'CB2', top: 70, left: 65 },
    { label: 'RB',  top: 70, left: 85 },
    { label: 'LM',  top: 50, left: 15 },
    { label: 'CM1', top: 50, left: 35 },
    { label: 'CM2', top: 50, left: 65 },
    { label: 'RM',  top: 50, left: 85 },
    { label: 'ST1', top: 25, left: 35 },
    { label: 'ST2', top: 25, left: 65 },
  ],
  '4-3-3': [
    { label: 'GK',  top: 88, left: 50 },
    { label: 'LB',  top: 70, left: 15 },
    { label: 'CB1', top: 70, left: 35 },
    { label: 'CB2', top: 70, left: 65 },
    { label: 'RB',  top: 70, left: 85 },
    { label: 'CM1', top: 50, left: 25 },
    { label: 'CM2', top: 50, left: 50 },
    { label: 'CM3', top: 50, left: 75 },
    { label: 'LW',  top: 20, left: 20 },
    { label: 'ST',  top: 15, left: 50 },
    { label: 'RW',  top: 20, left: 80 },
  ],
  '3-5-2': [
    { label: 'GK',  top: 88, left: 50 },
    { label: 'CB1', top: 70, left: 25 },
    { label: 'CB2', top: 70, left: 50 },
    { label: 'CB3', top: 70, left: 75 },
    { label: 'LWB', top: 52, left: 10 },
    { label: 'CM1', top: 50, left: 30 },
    { label: 'CM2', top: 50, left: 50 },
    { label: 'CM3', top: 50, left: 70 },
    { label: 'RWB', top: 52, left: 90 },
    { label: 'ST1', top: 22, left: 35 },
    { label: 'ST2', top: 22, left: 65 },
  ],
  '4-5-1': [
    { label: 'GK',  top: 88, left: 50 },
    { label: 'LB',  top: 70, left: 15 },
    { label: 'CB1', top: 70, left: 35 },
    { label: 'CB2', top: 70, left: 65 },
    { label: 'RB',  top: 70, left: 85 },
    { label: 'LM',  top: 50, left: 10 },
    { label: 'CM1', top: 50, left: 30 },
    { label: 'CM2', top: 50, left: 50 },
    { label: 'CM3', top: 50, left: 70 },
    { label: 'RM',  top: 50, left: 90 },
    { label: 'ST',  top: 18, left: 50 },
  ],
  '5-3-2': [
    { label: 'GK',  top: 88, left: 50 },
    { label: 'LWB', top: 68, left: 10 },
    { label: 'CB1', top: 70, left: 28 },
    { label: 'CB2', top: 70, left: 50 },
    { label: 'CB3', top: 70, left: 72 },
    { label: 'RWB', top: 68, left: 90 },
    { label: 'CM1', top: 48, left: 25 },
    { label: 'CM2', top: 48, left: 50 },
    { label: 'CM3', top: 48, left: 75 },
    { label: 'ST1', top: 22, left: 35 },
    { label: 'ST2', top: 22, left: 65 },
  ],
  '4-2-3-1': [
    { label: 'GK',  top: 88, left: 50 },
    { label: 'LB',  top: 72, left: 15 },
    { label: 'CB1', top: 72, left: 35 },
    { label: 'CB2', top: 72, left: 65 },
    { label: 'RB',  top: 72, left: 85 },
    { label: 'DM1', top: 57, left: 35 },
    { label: 'DM2', top: 57, left: 65 },
    { label: 'LAM', top: 38, left: 20 },
    { label: 'CAM', top: 35, left: 50 },
    { label: 'RAM', top: 38, left: 80 },
    { label: 'ST',  top: 18, left: 50 },
  ],
};

// ── Read-only mini pitch for fan view (Type A) ────────────────────────────────
function FanMiniPitch({ formation, tactics, teamLabel, color }) {
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingBottom: '145%',
      background: 'linear-gradient(180deg, #1a6b2a 0%, #1e7a30 50%, #1a6b2a 100%)',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ position: 'absolute', top: '44%', left: '25%', right: '25%', bottom: '3%', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: '2%', left: '25%', right: '25%', height: '10%', border: '1px solid rgba(255,255,255,0.2)' }} />
      </div>
      <div style={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 9, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)', zIndex: 5 }}>
        {teamLabel}
      </div>
      <div style={{ position: 'absolute', bottom: 3, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 8, zIndex: 5 }}>
        {formation}
      </div>
      {slots.map((slot, idx) => {
        const player = tactics[idx];
        return (
          <div key={idx} style={{
            position: 'absolute', top: `${slot.top}%`, left: `${slot.left}%`,
            transform: 'translate(-50%,-50%)', zIndex: 10, textAlign: 'center',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: player ? color : 'rgba(255,255,255,0.1)',
              border: `1.5px solid ${player ? '#fff' : 'rgba(255,255,255,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 6, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}>
              {player
                ? (player.name || player.playerName || player.Name || '?').substring(0, 3)
                : slot.label.substring(0, 2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FAN VOTING STAGE
// ══════════════════════════════════════════════════════════════════════════════
function FanVotingStage({ socket, gameState, myTxId, isReferee }) {
  // ── ALL hooks declared unconditionally at the top — before any early return ──
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [teamVote, setTeamVote] = useState(null);
  const [scores, setScores] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    function onBallotResult({ success, error }) {
      if (success) {
        setSubmitStatus("success");
        setSubmitError("");
      } else {
        setSubmitStatus("error");
        setSubmitError(
          error === "ALREADY_VOTED"
            ? "You have already voted on this match."
            : error === "MATCH_CLOSED"
            ? "This match is no longer accepting votes."
            : error === "VOTING_LOCKED"
            ? "Voting is currently closed."
            : error === "NOT_VERIFIED"
            ? "Your ticket is not verified."
            : error === "MODE_NOT_OPEN"
            ? "This voting mode is not currently open."
            : `Error: ${error}`
        );
      }
    }
    socket.on("ballotResult", onBallotResult);
    return () => socket.off("ballotResult", onBallotResult);
  }, [socket]);

  // ── Derived state references (safe to compute unconditionally) ────────────
  const gs = gameState;
  const votingMatches = gs.votingMatches || [];
  const voteRegistry = gs.voteRegistry || {};
  const votingMode = gs.votingMode;
  const typeAStats = gs.typeAStats || {};
  const typeBStats = gs.typeBStats || {};

  // ── All useCallback hooks declared unconditionally BEFORE any early return ─
  const handleScoreChange = useCallback((name, val) => {
    setScores(prev => ({ ...prev, [name]: val }));
  }, []);

  const handleSelectMatch = useCallback((m) => {
    setSelectedMatch(m);
    setTeamVote(null);
    setScores({});
    setSubmitStatus(null);
    setSubmitError("");
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedMatch || !myTxId) return;
    const alreadyVoted = (voteRegistry[selectedMatch.matchId] || []).includes(myTxId);
    if (alreadyVoted) {
      setSubmitStatus("error");
      setSubmitError("You have already voted on this match.");
      return;
    }
    if (selectedMatch.matchType === 'A') {
      if (!teamVote) {
        setSubmitError("Please select which team you think won.");
        return;
      }
      socket.emit("fanSubmitBallot", {
        txId: myTxId,
        matchId: selectedMatch.matchId,
        teamVote,
        matchType: 'A',
      });
    } else {
      socket.emit("fanSubmitBallot", {
        txId: myTxId,
        matchId: selectedMatch.matchId,
        scores,
        matchType: 'B',
      });
    }
  }, [selectedMatch, myTxId, teamVote, scores, voteRegistry, socket]);

  // ── cardStyle helper (plain function, not a hook — safe anywhere) ─────────
  const cardStyle = (isSelected) => ({
    background: isSelected ? "#1a2a3a" : "#111",
    border: `1px solid ${isSelected ? "#4fc3f7" : "#333"}`,
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 10,
    cursor: "pointer",
    transition: "border 0.15s, background 0.15s",
  });

  // ── §3.1 Blind Voting Gate: early return AFTER all hooks ──────────────────
  if (!isReferee && !gs.votingAllowed) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#777", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏟️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#aaa" }}>Waiting for the Arena to open…</div>
      </div>
    );
  }

  // ── Filter matches by current voting mode ─────────────────────────────────
  const visibleMatches = isReferee
    ? votingMatches
    : votingMatches.filter(m => {
        if (!votingMode || votingMode === 'BOTH') return true;
        return m.matchType === votingMode;
      });

  const openMatches = visibleMatches.filter(m => m.status === 'OPEN');

  return (
    <div style={{ fontFamily: "sans-serif", color: "#eee", maxWidth: 900, margin: "0 auto", padding: 12 }}>
      <h2 style={{ color: "#4fc3f7", marginBottom: 4 }}>🗳️ Fan Voting Room</h2>

      {openMatches.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, color: "#777" }}>
          ⏳ No matches are currently open for public review.
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {/* ── Match List ── */}
        <div style={{ flex: "0 0 280px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f9a825", marginBottom: 8 }}>
            Available Matches ({openMatches.length} open)
          </div>
          {openMatches.map(m => {
            const hasVoted = (voteRegistry[m.matchId] || []).includes(myTxId);
            const aStats = typeAStats[m.matchId];
            const bStats = typeBStats[m.matchId];
            return (
              <div
                key={m.matchId}
                onClick={() => handleSelectMatch(m)}
                style={cardStyle(selectedMatch?.matchId === m.matchId)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, padding: "2px 5px", borderRadius: 8,
                    background: m.matchType === "A" ? "#1565c0" : "#6a1b9a",
                    color: "#fff", fontWeight: 700,
                  }}>
                    Type {m.matchType}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: "#80cbc4" }}>{m.matchId}</span>
                  {hasVoted && <span style={{ fontSize: 10, color: "#66bb6a" }}>✅ Voted</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                {/* Live vote counters for Type A */}
                {m.matchType === 'A' && aStats && (
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, display: "flex", gap: 12 }}>
                    <span>🔵 {aStats.team1Votes} votes</span>
                    <span>🔴 {aStats.team2Votes} votes</span>
                  </div>
                )}
                {/* Per-participant averages for Type B */}
                {m.matchType === 'B' && bStats && Object.keys(bStats).length > 0 && (
                  <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
                    {Object.entries(bStats).slice(0, 3).map(([name, avg]) => (
                      <span key={name} style={{ marginRight: 8 }}>{name}: {avg}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Vote Panel ── */}
        {selectedMatch && (
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: 10,
              padding: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{
                  fontSize: 10, padding: "2px 6px", borderRadius: 8,
                  background: selectedMatch.matchType === "A" ? "#1565c0" : "#6a1b9a",
                  color: "#fff", fontWeight: 700,
                }}>
                  Type {selectedMatch.matchType}
                </span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#80cbc4" }}>{selectedMatch.matchId}</span>
              </div>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#fff" }}>{selectedMatch.name}</h3>

              {/* ── Type A: Team vote with pitch preview ── */}
              {selectedMatch.matchType === "A" && (() => {
                const t1 = selectedMatch.t1Tactics || {};
                const t2 = selectedMatch.t2Tactics || {};
                const f1 = selectedMatch.team1Formation || '4-4-2';
                const f2 = selectedMatch.team2Formation || '4-4-2';
                const hasVoted = (voteRegistry[selectedMatch.matchId] || []).includes(myTxId);
                const aStats = typeAStats[selectedMatch.matchId];
                return (
                  <div>
                    {/* Side-by-side read-only pitch snapshots */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#42a5f5", marginBottom: 4, textAlign: "center" }}>
                          🔵 {selectedMatch.coach1 || 'Team 1'}
                        </div>
                        <FanMiniPitch formation={f1} tactics={t1} teamLabel={selectedMatch.coach1 || 'Team 1'} color="#1565c0" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#ef5350", marginBottom: 4, textAlign: "center" }}>
                          🔴 {selectedMatch.coach2 || 'Team 2'}
                        </div>
                        <FanMiniPitch formation={f2} tactics={t2} teamLabel={selectedMatch.coach2 || 'Team 2'} color="#b71c1c" />
                      </div>
                    </div>
                    {/* Vote counters */}
                    {aStats && (
                      <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 13 }}>
                        <span style={{ color: "#42a5f5" }}>🔵 {aStats.team1Votes} votes</span>
                        <span style={{ color: "#ef5350" }}>🔴 {aStats.team2Votes} votes</span>
                      </div>
                    )}
                    {!hasVoted && submitStatus !== "success" ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#f9a825" }}>
                          Who won the tactical battle?
                        </div>
                        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                          <button
                            onClick={() => setTeamVote("team1")}
                            style={{
                              flex: 1, padding: "12px", borderRadius: 8, border: "2px solid",
                              borderColor: teamVote === "team1" ? "#42a5f5" : "#333",
                              background: teamVote === "team1" ? "#1565c0" : "#1a1a2e",
                              color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13,
                            }}
                          >
                            🔵 {selectedMatch.coach1 || 'Team 1'}
                          </button>
                          <button
                            onClick={() => setTeamVote("team2")}
                            style={{
                              flex: 1, padding: "12px", borderRadius: 8, border: "2px solid",
                              borderColor: teamVote === "team2" ? "#ef5350" : "#333",
                              background: teamVote === "team2" ? "#b71c1c" : "#1a1a2e",
                              color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13,
                            }}
                          >
                            🔴 {selectedMatch.coach2 || 'Team 2'}
                          </button>
                        </div>
                        {submitError && <div style={{ color: "#ef5350", fontSize: 12, marginBottom: 8 }}>❌ {submitError}</div>}
                        <button
                          onClick={handleSubmit}
                          disabled={!teamVote}
                          style={{
                            width: "100%", padding: "12px", borderRadius: 8,
                            background: teamVote ? "#2e7d32" : "#333",
                            color: "#fff", border: "none", fontWeight: 700,
                            fontSize: 14, cursor: teamVote ? "pointer" : "not-allowed",
                            opacity: teamVote ? 1 : 0.6,
                          }}
                        >
                          ✅ Submit Vote
                        </button>
                      </>
                    ) : hasVoted || submitStatus === "success" ? (
                      <div style={{ textAlign: "center", padding: 20, color: "#66bb6a", fontSize: 15, fontWeight: 700 }}>
                        ✅ Vote submitted! Thank you.
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              {/* ── Type B: Per-participant score sliders ── */}
              {selectedMatch.matchType === "B" && (() => {
                const hasVoted = (voteRegistry[selectedMatch.matchId] || []).includes(myTxId);
                const bStats = typeBStats[selectedMatch.matchId];

                const team1Players = parseTypeBPlayers(selectedMatch.team1Players);
                const team2Players = parseTypeBPlayers(selectedMatch.team2Players);
                const coaches = [
                  selectedMatch.coach1 && { name: selectedMatch.coach1, role: "Coach 1" },
                  selectedMatch.coach2 && { name: selectedMatch.coach2, role: "Coach 2" },
                ].filter(Boolean);
                const refs = selectedMatch.referee1 ? [{ name: selectedMatch.referee1, role: "Referee" }] : [];
                const commentators = selectedMatch.commentator1 ? [{ name: selectedMatch.commentator1, role: "Commentator" }] : [];
                const allParticipants = [...team1Players, ...team2Players, ...coaches, ...refs, ...commentators];

                return (
                  <div>
                    {!hasVoted && submitStatus !== "success" ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#f9a825" }}>
                          Rate each participant (0–10):
                        </div>
                        <div style={{ maxHeight: 400, overflowY: "auto" }}>
                          {allParticipants.length === 0 ? (
                            <div style={{ color: "#777", fontSize: 12 }}>No participants listed for this match.</div>
                          ) : (
                            allParticipants.map(p => (
                              <ScoreInput
                                key={p.name}
                                name={p.name}
                                role={p.role}
                                value={scores[p.name] !== undefined ? scores[p.name] : 5}
                                onChange={handleScoreChange}
                                disabled={false}
                              />
                            ))
                          )}
                        </div>
                        {submitError && <div style={{ color: "#ef5350", fontSize: 12, margin: "8px 0" }}>❌ {submitError}</div>}
                        <button
                          onClick={handleSubmit}
                          style={{
                            width: "100%", padding: "12px", borderRadius: 8, marginTop: 10,
                            background: "#2e7d32", color: "#fff", border: "none",
                            fontWeight: 700, fontSize: 14, cursor: "pointer",
                          }}
                        >
                          ✅ Submit Scores
                        </button>
                      </>
                    ) : (
                      <div>
                        <div style={{ textAlign: "center", padding: "16px 0", color: "#66bb6a", fontSize: 15, fontWeight: 700 }}>
                          ✅ Scores submitted! Thank you.
                        </div>
                        {/* Show live averages post-vote */}
                        {bStats && Object.keys(bStats).length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 12, color: "#f9a825", fontWeight: 600, marginBottom: 6 }}>
                              📊 Live Averages:
                            </div>
                            {Object.entries(bStats).map(([name, avg]) => (
                              <div key={name} style={{
                                display: "flex", justifyContent: "space-between",
                                fontSize: 12, padding: "4px 0", borderBottom: "1px solid #222",
                              }}>
                                <span style={{ color: "#ccc" }}>{name}</span>
                                <span style={{ color: "#4fc3f7", fontWeight: 700 }}>{avg}/10</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FanVotingStage;
