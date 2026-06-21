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

// ── Formation Slot Templates ──────────────────────────────────────────────────
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

// ── Tactical Pitch (player view) ──────────────────────────────────────────────
function TacticalPitch({ formation, tactics, myPicks, onSlotClick, isLocked, teamColor }) {
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '130%', background: 'linear-gradient(180deg,#1a6b2a 0%,#1e7a30 50%,#1a6b2a 100%)', border: '2px solid #fff', borderRadius: 10, overflow: 'hidden', userSelect: 'none' }}>
      {/* pitch lines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ position: 'absolute', top: '44%', left: '20%', right: '20%', bottom: '3%', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: '2%', left: '20%', right: '20%', height: '10%', border: '1px solid rgba(255,255,255,0.3)' }} />
        <div style={{ position: 'absolute', top: '44%', left: '50%', transform: 'translate(-50%,-50%)', width: '20%', paddingBottom: '20%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} />
      </div>
      {slots.map((slot, idx) => {
        const placed = tactics[idx];
        return (
          <div key={idx} onClick={() => !isLocked && onSlotClick && onSlotClick(idx)}
            style={{ position: 'absolute', top: `${slot.top}%`, left: `${slot.left}%`, transform: 'translate(-50%,-50%)', zIndex: 10, textAlign: 'center', cursor: isLocked ? 'default' : 'pointer' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: placed ? teamColor : 'rgba(255,255,255,0.15)', border: `2px solid ${placed ? '#fff' : 'rgba(255,255,255,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)', boxShadow: placed ? '0 2px 8px rgba(0,0,0,0.5)' : 'none', transition: 'all 0.2s' }}>
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

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  // ── Auth state ────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState('login'); // 'login' | 'lobby' | 'app'
  const [loginName, setLoginName] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [myTxId, setMyTxId] = useState('');
  const [myName, setMyName] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  // ── Referee state ─────────────────────────────────────────────────────────
  const [isReferee, setIsReferee] = useState(false);
  const [refTokenInput, setRefTokenInput] = useState('');
  const [refError, setRefError] = useState('');

  // ── Game state ────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notification, setNotification] = useState('');

  const notifTimer = useRef(null);
  function showNotif(msg, ms = 3500) {
    setNotification(msg);
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(''), ms);
  }

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    function onState(gs) { setGameState(gs); }

    // ── joinResult: the critical gate ─────────────────────────────────────
    function onJoinResult({ success, error, isPremium: prem }) {
      setLoginLoading(false);
      if (success) {
        setIsPremium(!!prem);
        setScreen('lobby');
      } else {
        setLoginError(error || 'Access denied. Please check your MoMo transaction ID.');
      }
    }

    function onRefConfirm(ok) {
      if (ok) { setIsReferee(true); setRefError(''); setScreen('app'); }
      else { setRefError('Wrong token. Try again.'); }
    }

    function onError(msg) { showNotif('⚠️ ' + msg); }

    function onClearArena() {
      setScreen('login');
      setMyTxId(''); setMyName(''); setIsPremium(false);
      setIsReferee(false); setGameState(null);
    }

    socket.on('gameStateUpdate', onState);
    socket.on('joinResult', onJoinResult);
    socket.on('refConfirm', onRefConfirm);
    socket.on('error', onError);
    socket.on('clearArenaForce', onClearArena);

    return () => {
      socket.off('gameStateUpdate', onState);
      socket.off('joinResult', onJoinResult);
      socket.off('refConfirm', onRefConfirm);
      socket.off('error', onError);
      socket.off('clearArenaForce', onClearArena);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleJoin = useCallback(() => {
    const name = loginName.trim();
    const code = loginCode.trim();
    if (!name) { setLoginError('Please enter your name.'); return; }
    if (!code) { setLoginError('Please enter your MoMo transaction ID.'); return; }
    setLoginError('');
    setLoginLoading(true);
    socket.emit('joinWaitingRoom', { name, ticketCode: code });
    setMyTxId(code);
    setMyName(name);
  }, [loginName, loginCode]);

  const handleRefLogin = useCallback(() => {
    if (!refTokenInput.trim()) { setRefError('Enter referee token.'); return; }
    socket.emit('claimReferee', refTokenInput.trim());
  }, [refTokenInput]);

  const handlePickCard = useCallback((cardId) => {
    socket.emit('playerPickCard', cardId);
    setSelectedCard(null);
  }, []);

  const handleSetFormation = useCallback((formation) => {
    if (!gameState) return;
    const gs = gameState;
    const myRole = gs.allViewers?.find(v => v.txId === myTxId)?.role;
    if (myRole !== 'team1' && myRole !== 'team2') return;
    socket.emit('playerSetFormation', { team: myRole, formation });
  }, [gameState, myTxId]);

  const handleSlotClick = useCallback((slotIndex) => {
    if (!selectedCard) return;
    socket.emit('playerSetPosition', { cardId: selectedCard, slotIndex });
    setSelectedCard(null);
    setSelectedSlot(null);
  }, [selectedCard]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const gs = gameState;
  const myViewer = gs?.allViewers?.find(v => v.txId === myTxId);
  const myRole = myViewer?.role || 'spectator';
  const isTeam1 = myRole === 'team1';
  const isTeam2 = myRole === 'team2';
  const isTeamPlayer = isTeam1 || isTeam2;
  const myPicks = isTeam1 ? (gs?.team1Picks || []) : isTeam2 ? (gs?.team2Picks || []) : [];
  const myFormation = isTeam1 ? (gs?.team1Formation || '4-4-2') : isTeam2 ? (gs?.team2Formation || '4-4-2') : '4-4-2';
  const myTactics = isTeam1 ? (gs?.team1Tactics || {}) : (gs?.team2Tactics || {});
  const isMyTurn = (isTeam1 && gs?.currentTurn === 'team1') || (isTeam2 && gs?.currentTurn === 'team2');
  const isLocked = gs?.matchReady || false;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    page: { minHeight: '100vh', background: '#0a0a14', color: '#eee', fontFamily: "'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column' },
    card: { background: '#111827', border: '1px solid #1e2940', borderRadius: 12, padding: 20, marginBottom: 16 },
    btn: (bg, disabled) => ({ background: disabled ? '#2a2a3e' : bg, color: disabled ? '#666' : '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: disabled ? 0.6 : 1, transition: 'all 0.15s', margin: '3px 4px 3px 0' }),
    inp: { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #2a3550', background: '#0d1117', color: '#eee', fontSize: 14, boxSizing: 'border-box', marginBottom: 10, outline: 'none' },
    label: { display: 'block', fontSize: 12, color: '#8899bb', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
    error: { background: 'rgba(239,83,80,0.15)', border: '1px solid #ef5350', borderRadius: 8, padding: '10px 14px', color: '#ef9a9a', fontSize: 13, marginBottom: 12 },
    success: { background: 'rgba(102,187,106,0.15)', border: '1px solid #66bb6a', borderRadius: 8, padding: '10px 14px', color: '#a5d6a7', fontSize: 13, marginBottom: 12 },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: LOGIN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'login') {
    return (
      <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo / Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏟️</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#4fc3f7', letterSpacing: -0.5 }}>RUHAGO N'INSHUTI</h1>
            <p style={{ margin: '4px 0 0', color: '#5577aa', fontSize: 14 }}>Arena Fan Experience</p>
          </div>

          {/* Fan login */}
          <div style={S.card}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#f9a825' }}>🎫 Enter with MoMo Ticket</h2>
            {loginError && <div style={S.error}>❌ {loginError}</div>}
            <label style={S.label}>Your Name</label>
            <input style={S.inp} value={loginName} onChange={e => setLoginName(e.target.value)} placeholder="Enter your full name" onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            <label style={S.label}>MoMo Transaction ID</label>
            <input style={S.inp} value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="e.g. 12345678901" onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            <button style={{ ...S.btn('#1565c0', loginLoading), width: '100%', padding: '13px 18px', fontSize: 15 }} onClick={handleJoin} disabled={loginLoading}>
              {loginLoading ? '⏳ Verifying payment...' : '🚪 Enter Arena'}
            </button>
            <p style={{ fontSize: 11, color: '#445566', margin: '10px 0 0', textAlign: 'center' }}>
              Your MoMo TxId is the transaction number from your MTN payment SMS
            </p>
          </div>

          {/* Referee login */}
          <div style={{ ...S.card, background: '#0d0d1f', border: '1px solid #1a1a3e' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#7986cb' }}>🔐 Referee Access</h3>
            {refError && <div style={S.error}>{refError}</div>}
            <input style={{ ...S.inp, marginBottom: 8 }} type="password" value={refTokenInput} onChange={e => setRefTokenInput(e.target.value)} placeholder="Referee token" onKeyDown={e => e.key === 'Enter' && handleRefLogin()} />
            <button style={S.btn('#303f9f', false)} onClick={handleRefLogin}>🔓 Login as Referee</button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: LOBBY (verified fan waiting for match to start)
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'lobby' && gs && !gs.gameStarted) {
    const qrCodes = (gs.qrCodes || []).filter(q => q && q.trim() !== '');
    return (
      <div style={S.page}>
        {/* Notification */}
        {notification && (
          <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '10px 20px', borderRadius: 8, zIndex: 9999, fontSize: 13 }}>
            {notification}
          </div>
        )}

        {/* Header */}
        <div style={{ background: '#0d0d1f', borderBottom: '1px solid #1e1e3e', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#4fc3f7' }}>🏟️ RUHAGO N'INSHUTI</span>
            <span style={{ marginLeft: 10, fontSize: 12, padding: '2px 8px', borderRadius: 10, background: isPremium ? '#f9a825' : '#1565c0', color: '#fff' }}>{isPremium ? '⭐ VIP' : '🎫 Fan'}</span>
          </div>
          <span style={{ fontSize: 13, color: '#4a5568' }}>Welcome, <strong style={{ color: '#eee' }}>{myName}</strong></span>
        </div>

        {/* Arena Banner */}
        {gs.arenaBanner && (
          <div style={{ width: '100%', maxHeight: 220, overflow: 'hidden' }}>
            <img src={gs.arenaBanner} alt="Arena Banner" style={{ width: '100%', objectFit: 'cover', maxHeight: 220 }} onError={e => { e.target.style.display = 'none'; }} />
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, maxWidth: 700, margin: '0 auto', width: '100%' }}>

          {/* Status card */}
          <div style={{ ...S.card, textAlign: 'center', borderColor: '#2e7d32' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <h2 style={{ margin: '0 0 6px', color: '#66bb6a', fontSize: 20 }}>Payment Verified!</h2>
            <p style={{ color: '#8899bb', margin: '0 0 8px', fontSize: 14 }}>
              {isTeamPlayer
                ? `You are assigned as ${myRole === 'team1' ? '🔵 Team 1' : '🔴 Team 2'}. Waiting for the Referee to start.`
                : '⏳ Match will begin shortly. Enjoy the lobby!'}
            </p>
            {isPremium && <div style={{ display: 'inline-block', background: '#f9a825', color: '#000', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>⭐ VIP ACCESS</div>}
          </div>

          {/* Video */}
          {gs.youtubeLink && (
            <div style={S.card}>
              <h3 style={{ margin: '0 0 10px', color: '#f9a825', fontSize: 14 }}>▶️ Featured Video</h3>
              <a href={gs.youtubeLink} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#b71c1c', color: '#fff', padding: '12px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                <span style={{ fontSize: 20 }}>▶️</span> Watch Now
              </a>
            </div>
          )}

          {/* QR Codes */}
          {qrCodes.length > 0 && (
            <div style={S.card}>
              <h3 style={{ margin: '0 0 12px', color: '#f9a825', fontSize: 14 }}>📱 Scan QR Codes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {qrCodes.map((qr, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 6, textAlign: 'center' }}>
                    <img src={qr} alt={`QR ${i + 1}`} style={{ width: '100%', borderRadius: 4 }} onError={e => { e.target.parentElement.style.display = 'none'; }} />
                    <div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>QR {i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voting (if open before match) */}
          {gs.votingAllowed && (
            <div style={S.card}>
              <h3 style={{ margin: '0 0 10px', color: '#f9a825', fontSize: 14 }}>🗳️ Voting is Open!</h3>
              <FanVotingStage socket={socket} gameState={gs} myTxId={myTxId} />
            </div>
          )}

          {/* Connected fans count */}
          <div style={{ textAlign: 'center', color: '#445566', fontSize: 12, marginTop: 8 }}>
            👥 {gs.allViewers?.length || 0} fans connected
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: REFEREE DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  if (isReferee) {
    return (
      <div style={S.page}>
        {notification && (
          <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '10px 20px', borderRadius: 8, zIndex: 9999, fontSize: 13 }}>
            {notification}
          </div>
        )}
        <div style={{ background: '#0d0d1f', borderBottom: '1px solid #1e1e3e', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, color: '#4fc3f7' }}>🏟️ REFEREE PANEL</span>
          <button style={S.btn('#333', false)} onClick={() => { setIsReferee(false); setScreen('login'); }}>← Exit</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <RefereeDashboard socket={socket} gameState={gs} isReferee={true} />
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: GAME (fan + team players in active match)
  // ════════════════════════════════════════════════════════════════════════════
  if (!gs) {
    return (
      <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <p style={{ color: '#4a5568' }}>Connecting to Arena…</p>
        </div>
      </div>
    );
  }

  const qrCodes = (gs.qrCodes || []).filter(q => q && q.trim() !== '');

  return (
    <div style={S.page}>
      {notification && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#1e1e3e', border: '1px solid #4fc3f7', color: '#fff', padding: '10px 20px', borderRadius: 8, zIndex: 9999, fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
          {notification}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#0d0d1f', borderBottom: '1px solid #1e1e3e', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#4fc3f7' }}>🏟️ RUHAGO N'INSHUTI</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isPremium && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f9a825', color: '#000', fontWeight: 700 }}>⭐ VIP</span>}
          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: myRole === 'team1' ? '#1565c0' : myRole === 'team2' ? '#b71c1c' : '#2a2a3e', color: '#fff' }}>
            {myRole === 'team1' ? '🔵 Team 1' : myRole === 'team2' ? '🔴 Team 2' : '👁️ Spectator'}
          </span>
          <span style={{ fontSize: 12, color: '#4a5568' }}>{myName}</span>
        </div>
      </div>

      {/* Arena Banner */}
      {gs.arenaBanner && (
        <img src={gs.arenaBanner} alt="Banner" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

        {/* Video + QR row */}
        {(gs.youtubeLink || qrCodes.length > 0) && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            {gs.youtubeLink && (
              <a href={gs.youtubeLink} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#b71c1c', color: '#fff', padding: '9px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                ▶️ Watch Video
              </a>
            )}
            {qrCodes.slice(0, 3).map((qr, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 6, padding: 4, width: 64, height: 64, flexShrink: 0 }}>
                <img src={qr} alt={`QR ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }} onError={e => { e.target.parentElement.style.display = 'none'; }} />
              </div>
            ))}
          </div>
        )}

        {/* Scoreboard */}
        <div style={{ ...S.card, textAlign: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#42a5f5' }}>{gs.team1Player?.name || 'Team 1'}</div>
              <div style={{ fontSize: 11, color: '#4a5568' }}>{gs.team1Picks?.length || 0}/11 picks</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#555' }}>VS</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef5350' }}>{gs.team2Player?.name || 'Team 2'}</div>
              <div style={{ fontSize: 11, color: '#4a5568' }}>{gs.team2Picks?.length || 0}/11 picks</div>
            </div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: gs.currentTurn === 'team1' ? '#1565c0' : '#b71c1c', color: '#fff' }}>
              {gs.currentTurn === 'team1' ? '🔵 Team 1\'s turn' : '🔴 Team 2\'s turn'}
            </span>
            {isLocked && <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: '#2e7d32', color: '#fff' }}>🔒 Locked</span>}
          </div>
        </div>

        {/* TEAM PLAYER: Draft + Tactics */}
        {isTeamPlayer && gs.gameStarted && (
          <>
            {/* Formation picker */}
            {!isLocked && (
              <div style={{ ...S.card, marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 8, fontWeight: 700 }}>⚙️ FORMATION</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FORMATIONS.map(f => (
                    <button key={f} style={{ ...S.btn(f === myFormation ? '#00695c' : '#1e2940', false), padding: '6px 12px', fontSize: 12, border: f === myFormation ? '1px solid #4db6ac' : '1px solid #2a3550' }}
                      onClick={() => handleSetFormation(f)}>{f}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Pitch + Available cards side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14, marginBottom: 14 }}>
              {/* Tactical Pitch */}
              <div>
                <div style={{ fontSize: 12, color: '#8899bb', fontWeight: 700, marginBottom: 6 }}>
                  {selectedCard
                    ? `📌 Click a slot to place: ${myPicks.find(c => String(c.id) === String(selectedCard))?.name || selectedCard}`
                    : '🗺️ TACTICAL PITCH'}
                </div>
                <TacticalPitch formation={myFormation} tactics={myTactics} myPicks={myPicks} onSlotClick={handleSlotClick}
                  isLocked={isLocked} teamColor={isTeam1 ? '#1565c0' : '#b71c1c'} />
              </div>

              {/* My picks */}
              <div>
                <div style={{ fontSize: 12, color: '#8899bb', fontWeight: 700, marginBottom: 6 }}>🃏 MY PICKS ({myPicks.length}/11)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 380, overflowY: 'auto' }}>
                  {myPicks.map(card => {
                    const isSelected = String(selectedCard) === String(card.id);
                    return (
                      <div key={card.id} onClick={() => !isLocked && setSelectedCard(isSelected ? null : String(card.id))}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: isSelected ? '#1a3a6e' : '#0d1117', border: `1px solid ${isSelected ? '#42a5f5' : '#1e2940'}`, cursor: isLocked ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isTeam1 ? '#1565c0' : '#b71c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {card.rating || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#90caf9' : '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
                          <div style={{ fontSize: 10, color: '#556' }}>{card.position}</div>
                        </div>
                        {isSelected && !isLocked && <span style={{ fontSize: 10, color: '#42a5f5' }}>→ place</span>}
                      </div>
                    );
                  })}
                  {myPicks.length === 0 && <div style={{ color: '#445566', fontSize: 12, padding: 8 }}>No picks yet. Draft below!</div>}
                </div>
              </div>
            </div>

            {/* Draft card pool */}
            {!isLocked && gs.gameStarted && (
              <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#8899bb', fontWeight: 700 }}>🏪 DRAFT POOL ({gs.availableCards?.length || 0} left)</div>
                  {isMyTurn
                    ? <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#00695c', color: '#fff', fontWeight: 700 }}>✅ YOUR TURN</span>
                    : <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#333', color: '#888' }}>⏳ Opponent's turn</span>}
                </div>
                {myPicks.length >= 11
                  ? <div style={{ color: '#66bb6a', fontSize: 13, fontWeight: 700 }}>✅ Roster complete! Now arrange on the pitch.</div>
                  : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                      {(gs.availableCards || []).map(card => (
                        <div key={card.id} onClick={() => isMyTurn && myPicks.length < 11 && handlePickCard(card.id)}
                          style={{ padding: '8px 10px', borderRadius: 8, background: isMyTurn ? '#0d1929' : '#0a0a14', border: `1px solid ${isMyTurn ? '#1e3a5e' : '#1a1a2a'}`, cursor: isMyTurn ? 'pointer' : 'not-allowed', opacity: isMyTurn ? 1 : 0.5, transition: 'all 0.15s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1e2940', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#90caf9', flexShrink: 0 }}>
                              {card.rating || '?'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
                              <div style={{ fontSize: 10, color: '#556' }}>{card.position}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {/* SPECTATOR view */}
        {!isTeamPlayer && gs.gameStarted && (
          <div style={S.card}>
            <h3 style={{ margin: '0 0 12px', color: '#f9a825', fontSize: 14 }}>👁️ Live Match View</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#42a5f5', marginBottom: 6 }}>🔵 {gs.team1Player?.name || 'Team 1'}</div>
                {(gs.team1Picks || []).map((c, i) => (
                  <div key={i} style={{ fontSize: 11, padding: '2px 0', borderBottom: '1px solid #1e1e3e', color: '#ccc' }}>{c.name} <span style={{ color: '#556' }}>{c.position}</span></div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ef5350', marginBottom: 6 }}>🔴 {gs.team2Player?.name || 'Team 2'}</div>
                {(gs.team2Picks || []).map((c, i) => (
                  <div key={i} style={{ fontSize: 11, padding: '2px 0', borderBottom: '1px solid #1e1e3e', color: '#ccc' }}>{c.name} <span style={{ color: '#556' }}>{c.position}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Voting Stage */}
        {gs.votingAllowed && (
          <div style={S.card}>
            <h3 style={{ margin: '0 0 10px', color: '#f9a825', fontSize: 14 }}>🗳️ Cast Your Vote</h3>
            <FanVotingStage socket={socket} gameState={gs} myTxId={myTxId} />
          </div>
        )}

        {/* Lobby waiting state */}
        {!gs.gameStarted && screen !== 'login' && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
            <p style={{ color: '#4a5568', fontSize: 14 }}>Waiting for the Referee to start the match…</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
