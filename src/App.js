// src/App.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import RefereeDashboard from './RefereeDashboard';
import FanVotingStage from './FanVotingStage';

const BACKEND_URL = "https://football-backend-ykso.onrender.com";
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

// ── Formation Slot Templates (must match server + RefereeDashboard) ────────────
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

const FORMATIONS = Object.keys(FORMATION_SLOTS);

// ── Tactical Pitch (player view) ───────────────────────────────────────────────
function TacticalPitch({ formation, tactics, myPicks, onSlotClick, isLocked, teamColor }) {
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingBottom: '155%',
      background: 'linear-gradient(180deg, #1a6b2a 0%, #1e7a30 50%, #1a6b2a 100%)',
      border: '2px solid #fff',
      borderRadius: 10,
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* Pitch lines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ position: 'absolute', top: '44%', left: '20%', right: '20%', bottom: '2%', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: '1%', left: '20%', right: '20%', height: '10%', border: '1px solid rgba(255,255,255,0.3)' }} />
        <div style={{
          position: 'absolute', top: '47%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '22%', paddingBottom: '22%',
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.35)',
        }} />
      </div>
      {/* Formation label */}
      <div style={{
        position: 'absolute', bottom: 5, right: 8, zIndex: 5,
        color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600,
      }}>
        {formation}
      </div>
      {/* Slots */}
      {slots.map((slot, idx) => {
        const placed = tactics[idx];
        const isEmpty = !placed;
        return (
          <div
            key={idx}
            onClick={() => !isLocked && onSlotClick && onSlotClick(idx)}
            style={{
              position: 'absolute',
              top: `${slot.top}%`,
              left: `${slot.left}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              cursor: isLocked ? 'default' : 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: placed
                ? teamColor
                : 'rgba(255,255,255,0.12)',
              border: `2px solid ${placed ? '#fff' : 'rgba(255,255,255,0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: placed ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
            }}>
              {placed
                ? (placed.name || placed.playerName || placed.Name || '?').substring(0, 4)
                : isEmpty ? slot.label.substring(0, 2) : ''}
            </div>
            {placed && (
              <div style={{
                position: 'absolute', top: '110%', left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)',
                color: '#fff',
                fontSize: 8,
                padding: '1px 4px',
                borderRadius: 3,
                whiteSpace: 'nowrap',
                maxWidth: 64,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                pointerEvents: 'none',
              }}>
                {(placed.name || placed.playerName || placed.Name || '').substring(0, 10)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
function App() {
  const [gameState, setGameState] = useState(null);
  const [myName, setMyName] = useState(localStorage.getItem('draftName') || '');
  const [myTxId, setMyTxId] = useState(localStorage.getItem('myTxId') || '');
  const [joined, setJoined] = useState(false);
  const [refToken, setRefToken] = useState('');
  const [isRef, setIsRef] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [lobbySearch, setLobbySearch] = useState('');
  const [roomPhase, setRoomPhase] = useState('LOBBY');
  const [votingModeSelect, setVotingModeSelect] = useState('BOTH');

  const isRefRef = useRef(isRef);
  useEffect(() => { isRefRef.current = isRef; }, [isRef]);

  useEffect(() => {
    function onGameStateUpdate(state) {
      setGameState(state);
      if (state.roomPhase) setRoomPhase(state.roomPhase);
      const sTx = localStorage.getItem('myTxId');
      const userInLobby = state.allViewers?.find(v => v.txId === sTx);
      if (userInLobby || isRefRef.current) setJoined(true);
      else setJoined(false);
    }
    function onConnect() {
      const sTx = localStorage.getItem('myTxId');
      const sName = localStorage.getItem('draftName');
      if (sTx && sName) socket.emit('joinWaitingRoom', { name: sName, ticketCode: sTx });
    }
    function onClearArenaForce() {
      localStorage.removeItem('myTxId');
      localStorage.removeItem('draftName');
      setJoined(false);
      setIsRef(false);
      setRoomPhase('LOBBY');
      window.location.reload();
    }
    function onGameSyncPhase(phase) {
      setRoomPhase(phase);
      setActiveSlot(null);
      if (phase === 'LOBBY' && !isRefRef.current) setJoined(true);
    }
    function onRefConfirm(val) {
      setIsRef(val);
      isRefRef.current = val;
      setJoined(true);
    }
    function onError(message) {
      alert(message);
    }

    socket.on('gameStateUpdate', onGameStateUpdate);
    socket.on('connect', onConnect);
    socket.on('clearArenaForce', onClearArenaForce);
    socket.on('gameSyncPhase', onGameSyncPhase);
    socket.on('refConfirm', onRefConfirm);
    socket.on('error', onError);

    onConnect();

    const fetchInterval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/state`);
        if (res.ok) onGameStateUpdate(await res.json());
      } catch (e) {
        console.warn('State polling failure:', e);
      }
    }, 3000);

    return () => {
      clearInterval(fetchInterval);
      socket.off('gameStateUpdate', onGameStateUpdate);
      socket.off('connect', onConnect);
      socket.off('clearArenaForce', onClearArenaForce);
      socket.off('gameSyncPhase', onGameSyncPhase);
      socket.off('refConfirm', onRefConfirm);
      socket.off('error', onError);
    };
  }, []);

  const handleJoin = useCallback(() => {
    if (!myName || !myTxId) return alert('Uzuza imyirondoro yose (Fill all fields)');
    localStorage.setItem('draftName', myName);
    localStorage.setItem('myTxId', myTxId);
    socket.emit('joinWaitingRoom', { name: myName, ticketCode: myTxId });
  }, [myName, myTxId]);

  if (!gameState) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a1a', color: '#fff', fontSize: 18 }}>
        ⏳ Connecting to Arena…
      </div>
    );
  }

  const myViewer = gameState.allViewers?.find(v => v.txId === myTxId);
  const myRole = myViewer?.role || 'spectator';
  const isTeamPlayer = myRole === 'team1' || myRole === 'team2';
  const isSpectator = !isRef && !isTeamPlayer;

  // ── Referee view ──────────────────────────────────────────────────────────
  if (isRef) {
    return (
      <div style={{ background: '#0a0a1a', minHeight: '100vh' }}>
        {/* Ref-only: VIP Secure Live (hidden from all non-ref users) */}
        <div style={{ background: '#0d0d1f', borderBottom: '1px solid #222', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: '#f9a825', fontWeight: 700, fontSize: 14 }}>🏟️ Arena Referee Panel</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* VIP Secure Live — REFEREE ONLY, hidden from fans */}
            {myViewer?.isPremium && myViewer?.secureLink && (
              <a
                href={myViewer.secureLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#ffd700', textDecoration: 'none', padding: '4px 10px', border: '1px solid #ffd700', borderRadius: 6 }}
              >
                🔐 Secure VIP Live
              </a>
            )}
            {/* Voting mode selector */}
            <select
              value={votingModeSelect}
              onChange={e => setVotingModeSelect(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: '#1a1a2e', color: '#eee', border: '1px solid #555' }}
            >
              <option value="BOTH">Mode: A + B</option>
              <option value="A">Mode: A Only</option>
              <option value="B">Mode: B Only</option>
            </select>
            <button
              onClick={() => socket.emit('refToggleVotingGate', { allowed: !gameState.votingAllowed, mode: votingModeSelect })}
              style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: gameState.votingAllowed ? '#b71c1c' : '#2e7d32', color: '#fff', fontWeight: 700,
              }}
            >
              {gameState.votingAllowed ? '🚫 Close Voting' : '🗳️ Open Voting'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <RefereeDashboard
              socket={socket}
              gameState={gameState}
              isReferee={isRef}
              activeSlot={activeSlot}
              setActiveSlot={setActiveSlot}
            />
          </div>
          {/* Ref always sees the fan voting stage too for monitoring */}
          <div style={{ flex: 1, minWidth: 320, borderLeft: '1px solid #222' }}>
            <div style={{ padding: 12 }}>
              <div style={{ color: '#4fc3f7', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>👀 Fan Voting Monitor</div>
              <FanVotingStage socket={socket} gameState={gameState} myTxId={myTxId} isReferee={true} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div style={{ background: '#0a0a1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 32, maxWidth: 400, width: '100%', color: '#eee' }}>
          <h2 style={{ textAlign: 'center', color: '#4fc3f7', marginBottom: 24 }}>⚽ Arena Entry</h2>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: '#aaa', display: 'block', marginBottom: 4 }}>Display Name</label>
            <input
              value={myName}
              onChange={e => setMyName(e.target.value)}
              placeholder="Your name"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #444', background: '#1a1a2e', color: '#eee', fontSize: 14 }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: '#aaa', display: 'block', marginBottom: 4 }}>Ticket Code / TX ID</label>
            <input
              value={myTxId}
              onChange={e => setMyTxId(e.target.value)}
              placeholder="Your ticket code"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #444', background: '#1a1a2e', color: '#eee', fontSize: 14 }}
            />
          </div>
          <button
            onClick={handleJoin}
            style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: '#1565c0', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            🚀 Enter Arena
          </button>
          {/* Referee login */}
          <div style={{ marginTop: 24, borderTop: '1px solid #222', paddingTop: 18 }}>
            <label style={{ fontSize: 12, color: '#777', display: 'block', marginBottom: 4 }}>Referee Access</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={refToken}
                onChange={e => setRefToken(e.target.value)}
                placeholder="Referee token"
                style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #333', background: '#1a1a2e', color: '#eee', fontSize: 13 }}
              />
              <button
                onClick={() => socket.emit('claimReferee', refToken)}
                style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: '#f9a825', color: '#111', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Fan / Player Lobby View ───────────────────────────────────────────────
  // §3.1: Spectators see banners, QR codes, Watch Video link — NOT the draft panel.
  // §3.1: Voting gate is BLIND — no invite shown when CLOSED.

  const gs = gameState;

  // If voting is open and we are NOT in draft (spectator or voting phase), show voting stage
  if (roomPhase === 'VOTING' && gs.votingAllowed && !isTeamPlayer) {
    return (
      <div style={{ background: '#0a0a1a', minHeight: '100vh', padding: 16 }}>
        <FanVotingStage socket={socket} gameState={gs} myTxId={myTxId} isReferee={false} />
      </div>
    );
  }

  // If the user is an assigned team player in DRAFT phase, show draft panel
  if (isTeamPlayer && roomPhase === 'DRAFT' && gs.gameStarted) {
    const myTeam = myRole;
    const myPicks = myTeam === 'team1' ? gs.team1Picks || [] : gs.team2Picks || [];
    const opponentPicks = myTeam === 'team1' ? gs.team2Picks || [] : gs.team1Picks || [];
    const myTactics = myTeam === 'team1' ? gs.team1Tactics || {} : gs.team2Tactics || {};
    const myFormation = myTeam === 'team1' ? gs.team1Formation : gs.team2Formation;
    const isMyTurn = gs.currentTurn === myTeam;
    const isLocked = gs.matchReady;
    const filteredCards = (gs.availableCards || []).filter(c =>
      !lobbySearch || (c.name || c.playerName || c.Name || '').toLowerCase().includes(lobbySearch.toLowerCase())
    );

    return (
      <div style={{ background: '#0a0a1a', minHeight: '100vh', color: '#eee', fontFamily: 'sans-serif' }}>
        {/* Header */}
        <div style={{ background: '#0d0d1f', borderBottom: '1px solid #222', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: '#4fc3f7', fontWeight: 700 }}>
            {myTeam === 'team1' ? '🔵' : '🔴'} {myViewer?.name} — {myTeam === 'team1' ? 'Team 1' : 'Team 2'}
          </span>
          <span style={{
            fontSize: 13, padding: '4px 10px', borderRadius: 12,
            background: isMyTurn && !isLocked ? '#2e7d32' : '#b71c1c',
            color: '#fff', fontWeight: 700,
          }}>
            {isLocked ? '🔒 Locked' : isMyTurn ? '✅ Your Turn' : '⏳ Wait…'}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
          {/* ── Card Pool ── */}
          {!isLocked && (
            <div style={{ flex: '0 0 260px', borderRight: '1px solid #222', height: 'calc(100vh - 52px)', overflowY: 'auto', padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#f9a825' }}>
                🃏 Draft Pool ({filteredCards.length} cards)
              </div>
              <input
                value={lobbySearch}
                onChange={e => setLobbySearch(e.target.value)}
                placeholder="Search cards…"
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#1a1a2e', color: '#eee', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }}
              />
              {/* Roster cap warning */}
              {myPicks.length >= 11 && (
                <div style={{ fontSize: 11, color: '#f9a825', padding: '4px 8px', background: '#3e2800', borderRadius: 4, marginBottom: 8 }}>
                  ⚠️ Roster full (11/11). You cannot pick more cards.
                </div>
              )}
              {filteredCards.map((card) => {
                const cardId = String(card.id || card.Id || card.name || card.Name);
                const alreadyPicked = myPicks.some(c => String(c.id || c.Id) === cardId)
                  || opponentPicks.some(c => String(c.id || c.Id) === cardId);
                if (alreadyPicked) return null; // Hidden immediately on pick
                return (
                  <div
                    key={cardId}
                    onClick={() => {
                      if (!isMyTurn || myPicks.length >= 11 || isLocked) return;
                      socket.emit('playerPickCard', cardId);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid #333',
                      marginBottom: 6,
                      cursor: isMyTurn && myPicks.length < 11 && !isLocked ? 'pointer' : 'not-allowed',
                      background: isMyTurn && myPicks.length < 11 && !isLocked ? '#1a1a2e' : '#111',
                      opacity: isMyTurn && myPicks.length < 11 && !isLocked ? 1 : 0.5,
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{card.name || card.playerName || card.Name || cardId}</div>
                    {card.position && <div style={{ fontSize: 11, color: '#888' }}>{card.position}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Tactical Pitch ── */}
          <div style={{ flex: 1, minWidth: 280, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#f9a825' }}>
              ⚽ Tactical Formation
              {isLocked && <span style={{ color: '#ef5350', marginLeft: 8, fontSize: 12 }}>🔒 LOCKED — no changes allowed</span>}
            </div>
            {/* Formation selector */}
            {!isLocked && (
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#aaa', marginRight: 8 }}>Formation:</span>
                <select
                  value={myFormation}
                  onChange={e => socket.emit('playerSetFormation', { team: myTeam, formation: e.target.value })}
                  style={{ fontSize: 12, padding: '4px 8px', borderRadius: 5, background: '#1a1a2e', color: '#eee', border: '1px solid #555' }}
                >
                  {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}
            <div style={{ maxWidth: 320, margin: '0 auto' }}>
              <TacticalPitch
                formation={myFormation}
                tactics={myTactics}
                myPicks={myPicks}
                isLocked={isLocked}
                teamColor={myTeam === 'team1' ? '#1565c0' : '#b71c1c'}
                onSlotClick={(slotIdx) => {
                  if (isLocked) return;
                  if (activeSlot === null) {
                    setActiveSlot(slotIdx);
                  } else {
                    setActiveSlot(null);
                  }
                }}
              />
            </div>
          </div>

          {/* ── My Picks Sidebar ── */}
          <div style={{ flex: '0 0 200px', borderLeft: '1px solid #222', padding: 12, height: 'calc(100vh - 52px)', overflowY: 'auto' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#f9a825' }}>
              My Picks ({myPicks.length}/11)
            </div>
            {myPicks.map((card, i) => {
              const cardId = String(card.id || card.Id);
              const isSelected = activeSlot !== null && !isLocked;
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (isLocked || activeSlot === null) return;
                    socket.emit('playerSetPosition', { cardId, slotIndex: activeSlot });
                    setActiveSlot(null);
                  }}
                  style={{
                    padding: '7px 9px',
                    borderRadius: 6,
                    border: '1px solid #333',
                    marginBottom: 5,
                    cursor: isSelected ? 'pointer' : 'default',
                    background: isSelected ? '#1a3a1a' : '#111',
                    fontSize: 12,
                    transition: 'background 0.12s',
                  }}
                >
                  {card.name || card.playerName || card.Name || cardId}
                  {card.position && <div style={{ fontSize: 10, color: '#777' }}>{card.position}</div>}
                </div>
              );
            })}
            {activeSlot !== null && !isLocked && (
              <div style={{ fontSize: 11, color: '#4caf50', marginTop: 6 }}>
                ✅ Click a card above to place it in slot {FORMATION_SLOTS[myFormation]?.[activeSlot]?.label || activeSlot}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Default lobby / spectator view ───────────────────────────────────────
  // §3.1: Spectators see banner, QR codes, Watch Video — NOT the draft selection panel.
  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', color: '#eee', fontFamily: 'sans-serif', padding: 16 }}>
      {/* Arena Banner */}
      {gs.arenaBanner && (
        <div style={{ marginBottom: 16 }}>
          <img src={gs.arenaBanner} alt="Arena Banner" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10 }} />
        </div>
      )}

      <h2 style={{ color: '#4fc3f7', textAlign: 'center', marginBottom: 8 }}>
        ⚽ Welcome to the Arena
      </h2>
      <p style={{ textAlign: 'center', color: '#aaa', fontSize: 14, marginBottom: 20 }}>
        {isTeamPlayer
          ? `You are assigned as ${myRole === 'team1' ? 'Team 1' : 'Team 2'}. Waiting for the Referee to start the draft.`
          : `You are in the lobby. The match will begin shortly.`}
      </p>

      {/* Watch Video button */}
      {gs.youtubeLink && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <a
            href={gs.youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              background: '#c62828',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ▶️ Watch This Video
          </a>
        </div>
      )}

      {/* VIP Secure Live — only shown to the viewer themselves if premium. Hidden from regular fans viewing others. */}
      {myViewer?.isPremium && myViewer?.secureLink && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <a
            href={myViewer.secureLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '10px 22px',
              background: '#f9a825',
              color: '#111',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            🔐 Secure VIP Live Stream
          </a>
        </div>
      )}

      {/* QR Codes */}
      {gs.qrCodes && gs.qrCodes.some(q => q) && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#f9a825', marginBottom: 10 }}>📱 QR Codes</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {gs.qrCodes.filter(q => q).map((qr, i) => (
              <img
                key={i}
                src={qr}
                alt={`QR Code ${i + 1}`}
                style={{ width: 100, height: 100, borderRadius: 6, border: '2px solid #333' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* §3.1: Voting gate is BLIND — no invite shown when CLOSED */}
      {gs.votingAllowed && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => setRoomPhase('VOTING')}
            style={{
              padding: '12px 28px',
              background: '#1565c0',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🗳️ Go to Voting
          </button>
        </div>
      )}
      {/* When votingAllowed is false: absolutely no voting prompt shown */}
    </div>
  );
}

export default App;
