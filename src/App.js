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

const FORMATION_SLOTS = {
  '4-4-2': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LB', top: 70, left: 15 },
    { label: 'CB1', top: 70, left: 35 }, { label: 'CB2', top: 70, left: 65 },
    { label: 'RB', top: 70, left: 85 }, { label: 'LM', top: 50, left: 15 },
    { label: 'CM1', top: 50, left: 35 }, { label: 'CM2', top: 50, left: 65 },
    { label: 'RM', top: 50, left: 85 }, { label: 'ST1', top: 25, left: 35 },
    { label: 'ST2', top: 25, left: 65 },
  ],
  '4-3-3': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LB', top: 70, left: 15 },
    { label: 'CB1', top: 70, left: 35 }, { label: 'CB2', top: 70, left: 65 },
    { label: 'RB', top: 70, left: 85 }, { label: 'CM1', top: 50, left: 25 },
    { label: 'CM2', top: 50, left: 50 }, { label: 'CM3', top: 50, left: 75 },
    { label: 'LW', top: 20, left: 20 }, { label: 'ST', top: 15, left: 50 },
    { label: 'RW', top: 20, left: 80 },
  ],
  '3-5-2': [
    { label: 'GK', top: 88, left: 50 }, { label: 'CB1', top: 70, left: 25 },
    { label: 'CB2', top: 70, left: 50 }, { label: 'CB3', top: 70, left: 75 },
    { label: 'LWB', top: 52, left: 10 }, { label: 'CM1', top: 50, left: 30 },
    { label: 'CM2', top: 50, left: 50 }, { label: 'CM3', top: 50, left: 70 },
    { label: 'RWB', top: 52, left: 90 }, { label: 'ST1', top: 22, left: 35 },
    { label: 'ST2', top: 22, left: 65 },
  ],
  '4-5-1': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LB', top: 70, left: 15 },
    { label: 'CB1', top: 70, left: 35 }, { label: 'CB2', top: 70, left: 65 },
    { label: 'RB', top: 70, left: 85 }, { label: 'LM', top: 50, left: 10 },
    { label: 'CM1', top: 50, left: 30 }, { label: 'CM2', top: 50, left: 50 },
    { label: 'CM3', top: 50, left: 70 }, { label: 'RM', top: 50, left: 90 },
    { label: 'ST', top: 18, left: 50 },
  ],
  '5-3-2': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LWB', top: 68, left: 10 },
    { label: 'CB1', top: 70, left: 28 }, { label: 'CB2', top: 70, left: 50 },
    { label: 'CB3', top: 70, left: 72 }, { label: 'RWB', top: 68, left: 90 },
    { label: 'CM1', top: 48, left: 25 }, { label: 'CM2', top: 48, left: 50 },
    { label: 'CM3', top: 48, left: 75 }, { label: 'ST1', top: 22, left: 35 },
    { label: 'ST2', top: 22, left: 65 },
  ],
  '4-2-3-1': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LB', top: 72, left: 15 },
    { label: 'CB1', top: 72, left: 35 }, { label: 'CB2', top: 72, left: 65 },
    { label: 'RB', top: 72, left: 85 }, { label: 'DM1', top: 57, left: 35 },
    { label: 'DM2', top: 57, left: 65 }, { label: 'LAM', top: 38, left: 20 },
    { label: 'CAM', top: 35, left: 50 }, { label: 'RAM', top: 38, left: 80 },
    { label: 'ST', top: 18, left: 50 },
  ],
};
const FORMATIONS = Object.keys(FORMATION_SLOTS);

function TacticalPitch({ formation, tactics, myPicks, onSlotClick, isLocked, teamColor }) {
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '130%', background: 'linear-gradient(180deg,#1a6b2a 0%,#1e7a30 50%,#1a6b2a 100%)', border: '2px solid #fff', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ position: 'absolute', top: '44%', left: '20%', right: '20%', bottom: '3%', border: '1px solid rgba(255,255,255,0.3)' }} />
        <div style={{ position: 'absolute', top: '2%', left: '20%', right: '20%', height: '10%', border: '1px solid rgba(255,255,255,0.3)' }} />
      </div>
      {slots.map((slot, idx) => {
        const placed = tactics[idx];
        return (
          <div key={idx} onClick={() => !isLocked && onSlotClick && onSlotClick(idx)}
            style={{ position: 'absolute', top: slot.top + '%', left: slot.left + '%', transform: 'translate(-50%,-50%)', zIndex: 10, textAlign: 'center', cursor: isLocked ? 'default' : 'pointer' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: placed ? teamColor : 'rgba(255,255,255,0.15)', border: '2px solid ' + (placed ? '#fff' : 'rgba(255,255,255,0.4)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
              {placed ? (placed.name || '?').substring(0, 4) : slot.label}
            </div>
            {placed && (
              <div style={{ position: 'absolute', top: '105%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 7, padding: '1px 4px', borderRadius: 2, whiteSpace: 'nowrap', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(placed.name || '').substring(0, 9)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [myTxId, setMyTxId] = useState('');
  const [myName, setMyName] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isReferee, setIsReferee] = useState(false);
  const [refInput, setRefInput] = useState('');
  const [refError, setRefError] = useState('');
  const [gameState, setGameState] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [notification, setNotification] = useState('');
  const notifTimer = useRef(null);

  function showNotif(msg) {
    setNotification(msg);
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(''), 4000);
  }

  useEffect(() => {
    socket.on('gameStateUpdate', setGameState);

    socket.on('joinResult', function(data) {
      setJoinLoading(false);
      if (data.success) {
        setIsPremium(!!data.isPremium);
        setJoined(true);
        setJoinError('');
      } else {
        setJoinError(data.error || 'Payment not found. Check your MoMo transaction ID.');
      }
    });

    socket.on('refConfirm', function(ok) {
      if (ok) {
        setIsReferee(true);
        setRefError('');
      } else {
        setRefError('Wrong token.');
      }
    });

    socket.on('error', function(msg) { showNotif('⚠️ ' + msg); });
    socket.on('clearArenaForce', function() {
      setJoined(false);
      setIsReferee(false);
      setMyTxId('');
      setMyName('');
    });

    return function() {
      socket.off('gameStateUpdate');
      socket.off('joinResult');
      socket.off('refConfirm');
      socket.off('error');
      socket.off('clearArenaForce');
    };
  }, []);

  const handleJoin = useCallback(function() {
    var name = nameInput.trim();
    var code = codeInput.trim();
    if (!name) { setJoinError('Enter your name.'); return; }
    if (!code) { setJoinError('Enter your MoMo transaction ID.'); return; }
    setJoinError('');
    setJoinLoading(true);
    setMyTxId(code);
    setMyName(name);
    socket.emit('joinWaitingRoom', { name: name, ticketCode: code });
  }, [nameInput, codeInput]);

  const handleRefLogin = useCallback(function() {
    if (!refInput.trim()) { setRefError('Enter token.'); return; }
    socket.emit('claimReferee', refInput.trim());
  }, [refInput]);

  const gs = gameState;
  const myViewer = gs && gs.allViewers ? gs.allViewers.find(function(v) { return v.txId === myTxId; }) : null;
  const myRole = myViewer ? myViewer.role : 'spectator';
  const isTeam1 = myRole === 'team1';
  const isTeam2 = myRole === 'team2';
  const isTeamPlayer = isTeam1 || isTeam2;
  const myPicks = isTeam1 ? (gs ? gs.team1Picks || [] : []) : isTeam2 ? (gs ? gs.team2Picks || [] : []) : [];
  const myFormation = isTeam1 ? (gs ? gs.team1Formation || '4-4-2' : '4-4-2') : isTeam2 ? (gs ? gs.team2Formation || '4-4-2' : '4-4-2') : '4-4-2';
  const myTactics = isTeam1 ? (gs ? gs.team1Tactics || {} : {}) : (gs ? gs.team2Tactics || {} : {});
  const isMyTurn = (isTeam1 && gs && gs.currentTurn === 'team1') || (isTeam2 && gs && gs.currentTurn === 'team2');
  const isLocked = gs ? !!gs.matchReady : false;
  const qrCodes = gs && gs.qrCodes ? gs.qrCodes.filter(function(q) { return q && q.trim() !== ''; }) : [];

  var page = { minHeight: '100vh', background: '#0a0a14', color: '#eee', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' };
  var card = { background: '#111827', border: '1px solid #1e2940', borderRadius: 12, padding: 20, marginBottom: 14 };
  var inp = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #2a3550', background: '#0d1117', color: '#eee', fontSize: 14, boxSizing: 'border-box', marginBottom: 10 };
  var errBox = { background: 'rgba(239,83,80,0.15)', border: '1px solid #ef5350', borderRadius: 8, padding: '10px 14px', color: '#ef9a9a', fontSize: 13, marginBottom: 10 };

  function btn(bg, disabled) {
    return { background: disabled ? '#2a2a3e' : bg, color: disabled ? '#666' : '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, margin: '3px 4px 3px 0', opacity: disabled ? 0.6 : 1 };
  }

  // ── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (!joined && !isReferee) {
    return (
      <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 52, marginBottom: 6 }}>🏟️</div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#4fc3f7' }}>RUHAGO N'INSHUTI</h1>
            <p style={{ margin: '4px 0 0', color: '#4a5568', fontSize: 13 }}>Arena Fan Experience</p>
          </div>

          <div style={card}>
            <h2 style={{ margin: '0 0 14px', fontSize: 16, color: '#f9a825' }}>🎫 Enter with MoMo Ticket</h2>
            {joinError && <div style={errBox}>❌ {joinError}</div>}
            <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 4, fontWeight: 600 }}>YOUR NAME</div>
            <input style={inp} value={nameInput} onChange={function(e) { setNameInput(e.target.value); }} placeholder="Enter your full name" onKeyDown={function(e) { if (e.key === 'Enter') handleJoin(); }} />
            <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 4, fontWeight: 600 }}>MOMO TRANSACTION ID</div>
            <input style={inp} value={codeInput} onChange={function(e) { setCodeInput(e.target.value); }} placeholder="e.g. 12345678901" onKeyDown={function(e) { if (e.key === 'Enter') handleJoin(); }} />
            <button style={{ ...btn('#1565c0', joinLoading), width: '100%', padding: '13px', fontSize: 15, marginTop: 4 }} onClick={handleJoin} disabled={joinLoading}>
              {joinLoading ? '⏳ Verifying payment...' : '🚪 Enter Arena'}
            </button>
            <p style={{ fontSize: 11, color: '#3a4556', margin: '10px 0 0', textAlign: 'center' }}>Your MoMo TxId is the transaction number from your MTN payment SMS</p>
          </div>

          <div style={{ ...card, background: '#0d0d1f', border: '1px solid #1a1a3e' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, color: '#7986cb' }}>🔐 Referee Access</h3>
            {refError && <div style={errBox}>{refError}</div>}
            <input style={{ ...inp, marginBottom: 8 }} type="password" value={refInput} onChange={function(e) { setRefInput(e.target.value); }} placeholder="Referee token" onKeyDown={function(e) { if (e.key === 'Enter') handleRefLogin(); }} />
            <button style={btn('#303f9f', false)} onClick={handleRefLogin}>🔓 Referee Login</button>
          </div>
        </div>
      </div>
    );
  }

  // ── REFEREE SCREEN ──────────────────────────────────────────────────────────
  if (isReferee) {
    return (
      <div style={page}>
        {notification && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#1e1e3e', border: '1px solid #4fc3f7', color: '#fff', padding: '10px 20px', borderRadius: 8, zIndex: 9999, fontSize: 13 }}>{notification}</div>}
        <div style={{ background: '#0d0d1f', borderBottom: '1px solid #1e1e3e', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontWeight: 800, color: '#4fc3f7', fontSize: 15 }}>🏟️ REFEREE PANEL</span>
          <button style={btn('#333', false)} onClick={function() { setIsReferee(false); }}>← Exit</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <RefereeDashboard socket={socket} gameState={gs} isReferee={true} />
        </div>
      </div>
    );
  }

  // ── FAN SCREEN (joined, waiting or in-game) ─────────────────────────────────
  if (!gs) {
    return <div style={{ ...page, alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>⏳</div><p style={{ color: '#4a5568' }}>Connecting…</p></div></div>;
  }

  return (
    <div style={page}>
      {notification && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#1e1e3e', border: '1px solid #4fc3f7', color: '#fff', padding: '10px 20px', borderRadius: 8, zIndex: 9999, fontSize: 13 }}>{notification}</div>}

      {/* Header */}
      <div style={{ background: '#0d0d1f', borderBottom: '1px solid #1e1e3e', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 800, color: '#4fc3f7', fontSize: 15 }}>🏟️ RUHAGO N'INSHUTI</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPremium && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f9a825', color: '#000', fontWeight: 700 }}>⭐ VIP</span>}
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: myRole === 'team1' ? '#1565c0' : myRole === 'team2' ? '#b71c1c' : '#2a2a3e', color: '#fff' }}>
            {myRole === 'team1' ? '🔵 Team 1' : myRole === 'team2' ? '🔴 Team 2' : '👁️ Fan'}
          </span>
          <span style={{ fontSize: 12, color: '#4a5568' }}>{myName}</span>
        </div>
      </div>

      {/* Banner */}
      {gs.arenaBanner && (
        <img src={gs.arenaBanner} alt="Arena Banner" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block', flexShrink: 0 }} onError={function(e) { e.target.style.display = 'none'; }} />
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

        {/* Video + QR */}
        {(gs.youtubeLink || qrCodes.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
            {gs.youtubeLink && (
              <a href={gs.youtubeLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#b71c1c', color: '#fff', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                ▶️ Watch Video
              </a>
            )}
            {qrCodes.map(function(qr, i) {
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 6, padding: 4, width: 72, height: 72 }}>
                  <img src={qr} alt={'QR ' + (i + 1)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={function(e) { e.target.parentElement.style.display = 'none'; }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Waiting lobby */}
        {!gs.gameStarted && (
          <div style={{ ...card, textAlign: 'center', borderColor: '#2e7d32' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <h2 style={{ margin: '0 0 6px', color: '#66bb6a', fontSize: 18 }}>Payment Verified!</h2>
            <p style={{ color: '#8899bb', margin: 0, fontSize: 13 }}>
              {isTeamPlayer ? 'You are assigned to ' + (isTeam1 ? '🔵 Team 1' : '🔴 Team 2') + '. Waiting for the Referee to start.' : '⏳ Waiting for the match to begin…'}
            </p>
            <p style={{ color: '#4a5568', fontSize: 12, marginTop: 8 }}>👥 {gs.allViewers ? gs.allViewers.length : 0} fans connected</p>
          </div>
        )}

        {/* Match scoreboard */}
        {gs.gameStarted && (
          <div style={{ ...card, textAlign: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: '#42a5f5' }}>{gs.team1Player ? gs.team1Player.name : 'Team 1'}</div><div style={{ fontSize: 11, color: '#4a5568' }}>{gs.team1Picks ? gs.team1Picks.length : 0}/11</div></div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#555' }}>VS</div>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: '#ef5350' }}>{gs.team2Player ? gs.team2Player.name : 'Team 2'}</div><div style={{ fontSize: 11, color: '#4a5568' }}>{gs.team2Picks ? gs.team2Picks.length : 0}/11</div></div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: gs.currentTurn === 'team1' ? '#1565c0' : '#b71c1c', color: '#fff' }}>
                {gs.currentTurn === 'team1' ? '🔵 Team 1 picking' : '🔴 Team 2 picking'}
              </span>
              {isLocked && <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: '#2e7d32', color: '#fff', marginLeft: 8 }}>🔒 Locked</span>}
            </div>
          </div>
        )}

        {/* Team player: formation + pitch + picks + draft */}
        {isTeamPlayer && gs.gameStarted && (
          <div>
            {!isLocked && (
              <div style={{ ...card, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 700, marginBottom: 8 }}>⚙️ FORMATION</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FORMATIONS.map(function(f) {
                    return (
                      <button key={f} style={{ ...btn(f === myFormation ? '#00695c' : '#1e2940', false), fontSize: 12, padding: '5px 10px', border: f === myFormation ? '1px solid #4db6ac' : '1px solid #2a3550' }}
                        onClick={function() { socket.emit('playerSetFormation', { team: myRole, formation: f }); }}>
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 700, marginBottom: 6 }}>
                  {selectedCard ? '📌 Tap a slot to place player' : '🗺️ TACTICAL PITCH'}
                </div>
                <TacticalPitch
                  formation={myFormation}
                  tactics={myTactics}
                  myPicks={myPicks}
                  isLocked={isLocked}
                  teamColor={isTeam1 ? '#1565c0' : '#b71c1c'}
                  onSlotClick={function(slotIndex) {
                    if (!selectedCard) return;
                    socket.emit('playerSetPosition', { cardId: selectedCard, slotIndex: slotIndex });
                    setSelectedCard(null);
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 700, marginBottom: 6 }}>🃏 MY PICKS ({myPicks.length}/11)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 370, overflowY: 'auto' }}>
                  {myPicks.map(function(card) {
                    var isSel = String(selectedCard) === String(card.id);
                    return (
                      <div key={card.id}
                        onClick={function() { if (!isLocked) setSelectedCard(isSel ? null : String(card.id)); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: isSel ? '#1a3a6e' : '#0d1117', border: '1px solid ' + (isSel ? '#42a5f5' : '#1e2940'), cursor: isLocked ? 'default' : 'pointer' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: isTeam1 ? '#1565c0' : '#b71c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {card.rating || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isSel ? '#90caf9' : '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
                          <div style={{ fontSize: 10, color: '#556' }}>{card.position}</div>
                        </div>
                        {isSel && !isLocked && <span style={{ fontSize: 10, color: '#42a5f5' }}>→ place</span>}
                      </div>
                    );
                  })}
                  {myPicks.length === 0 && <div style={{ color: '#445566', fontSize: 12, padding: 8 }}>No picks yet.</div>}
                </div>
              </div>
            </div>

            {!isLocked && (
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 700 }}>🏪 DRAFT POOL ({gs.availableCards ? gs.availableCards.length : 0} left)</div>
                  {isMyTurn
                    ? <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#00695c', color: '#fff', fontWeight: 700 }}>✅ YOUR TURN</span>
                    : <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#333', color: '#888' }}>⏳ Wait…</span>}
                </div>
                {myPicks.length >= 11
                  ? <div style={{ color: '#66bb6a', fontSize: 13 }}>✅ Roster full! Place players on the pitch above.</div>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                      {(gs.availableCards || []).map(function(c) {
                        return (
                          <div key={c.id}
                            onClick={function() { if (isMyTurn && myPicks.length < 11) socket.emit('playerPickCard', c.id); }}
                            style={{ padding: '8px 10px', borderRadius: 8, background: isMyTurn ? '#0d1929' : '#0a0a14', border: '1px solid ' + (isMyTurn ? '#1e3a5e' : '#1a1a2a'), cursor: isMyTurn ? 'pointer' : 'not-allowed', opacity: isMyTurn ? 1 : 0.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1e2940', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#90caf9', flexShrink: 0 }}>{c.rating || '?'}</div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                <div style={{ fontSize: 10, color: '#556' }}>{c.position}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>}
              </div>
            )}
          </div>
        )}

        {/* Spectator view */}
        {!isTeamPlayer && gs.gameStarted && (
          <div style={card}>
            <h3 style={{ margin: '0 0 10px', color: '#f9a825', fontSize: 14 }}>👁️ Live Match</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#42a5f5', marginBottom: 6 }}>🔵 {gs.team1Player ? gs.team1Player.name : 'Team 1'}</div>
                {(gs.team1Picks || []).map(function(c, i) { return <div key={i} style={{ fontSize: 11, padding: '2px 0', borderBottom: '1px solid #1e1e3e', color: '#ccc' }}>{c.name} <span style={{ color: '#556' }}>{c.position}</span></div>; })}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ef5350', marginBottom: 6 }}>🔴 {gs.team2Player ? gs.team2Player.name : 'Team 2'}</div>
                {(gs.team2Picks || []).map(function(c, i) { return <div key={i} style={{ fontSize: 11, padding: '2px 0', borderBottom: '1px solid #1e1e3e', color: '#ccc' }}>{c.name} <span style={{ color: '#556' }}>{c.position}</span></div>; })}
              </div>
            </div>
          </div>
        )}

        {/* Voting */}
        {gs.votingAllowed && (
          <div style={card}>
            <h3 style={{ margin: '0 0 10px', color: '#f9a825', fontSize: 14 }}>🗳️ Cast Your Vote</h3>
            <FanVotingStage socket={socket} gameState={gs} myTxId={myTxId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
